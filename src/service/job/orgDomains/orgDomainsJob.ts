import { getAllDomains } from '../../../db/identity/database'
import { getOrganisationDomains } from '../../../db/shared/database'
import { uploadFile } from '../../azure/storage/blob/service'
import type { UploadResult } from '../../azure/storage/blob/service'
import { JobsFile } from '../../file/models'
import type { IDomain } from '../../orgDomains/model/IDomain'
import { Job } from '../Job'
import type { JobResult } from '../jobService'
import log from 'log'
import { sendOrgDomainsNotification, sendOrgDomainsPasswordNotification } from '../../notification/govUKNotify/govUkNotify'
import { createExcelSpreadsheetfromOrgDomainData } from '../../file/excel'
import { groupOrganisationsByDomain } from '../../orgDomains/orgDomainGrouping'
import type { IOrgDomainData } from '../../orgDomains/model/IOrgDomainData'
import * as zip from '../../file/zip'
import type { Workbook } from 'exceljs'

export class OrgDomainsJob extends Job {
  protected async runJob (): Promise<JobResult> {
    log.info('Running organisation domains job...')
    const data: IOrgDomainData = await getDataFromDatabase()
    const organisationsGroupedByDomains: IDomain[] = groupOrganisationsByDomain(data.allDomains, data.organisationDomains)
    const spreadsheetFileName: string = getSpreadsheetFileName()
    const workbook: Workbook = createSpreadsheet(organisationsGroupedByDomains)
    const workbookContent: Buffer = await workbook.xlsx.writeBuffer() as Buffer
    const zipFileResult: zip.EncryptedZipResult = await storeSpreadsheetAsZipFile(spreadsheetFileName, workbookContent)
    const zipUploadResult: UploadResult = await uploadZipFileToBlobStorage(zipFileResult.result)
    await sendZipFileAsEmail(zipUploadResult)
    await sendPasswordAsEmail(zipFileResult.password)

    return {
      text: 'Organisation domains file has been successfully created and sent.'
    }
  }

  public getName (): string {
    return 'Organisation domains file'
  }
}

export const getDataFromDatabase = async (): Promise<IOrgDomainData> => {
  log.info('Getting domain and organisation data from the database...')

  const allDomains = await getAllDomains()
  const organisationDomains = await getOrganisationDomains()

  log.info(`Found ${allDomains.length} unique domains.`)
  log.info(`Found ${organisationDomains.length} organisation/domain pairs.`)

  return {
    allDomains,
    organisationDomains
  }
}

export const getSpreadsheetFileName = (): string => {
  const now = new Date()

  const day: string = now.getDate() < 10 ? `0${now.getDate()}` : now.getDate().toString()
  const month: string = (now.getMonth() + 1) < 10 ? `0${(now.getMonth() + 1)}` : (now.getMonth() + 1).toString()
  const year: string = now.getFullYear().toString()

  const dateSuffix = `${day}${month}${year}`

  const fileName: string = `orgDomains-${dateSuffix}.xlsx`

  return fileName
}

export const createSpreadsheet = (orgDomainData: IDomain[]): Workbook => {
  log.info('Creating spreadsheet...')
  const workbook: Workbook = createExcelSpreadsheetfromOrgDomainData(orgDomainData)
  log.info('Spreadsheet created.')
  return workbook
}

export const storeSpreadsheetAsZipFile = async (fileName: string, spreadsheetContent: Buffer): Promise<zip.EncryptedZipResult> => {
  log.info('Archiving Excel file in a Zip file...')
  const encryptedFileResult: zip.EncryptedZipResult = await zip.zipFiles([JobsFile.from(fileName, spreadsheetContent)], 'orgDomains.zip')
  return encryptedFileResult
}

export const uploadZipFileToBlobStorage = async (file: JobsFile): Promise<UploadResult> => {
  log.info('Uploading zip file....')
  const uploadResult: UploadResult = await uploadFile('orgdomain-files', file)
  log.info('Zip file uploaded.')
  return uploadResult
}

export const sendZipFileAsEmail = async (uploadResult: UploadResult): Promise<void> => {
  log.info('Sending Zip file as email...')
  await sendOrgDomainsNotification('Organisation domains', new Date(), uploadResult)
  log.info('Spreadsheet email sent.')
}

export const sendPasswordAsEmail = async (password: string): Promise<void> => {
  log.info('Sending password as email...')
  await sendOrgDomainsPasswordNotification('Organisation domains', password)
  log.info('Password sent.')
}
