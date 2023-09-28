import { readFileSync } from 'fs'
import { getAllDomains } from '../../../db/identity/database'
import { getOrganisationDomains } from '../../../db/shared/database'
import { uploadFile } from '../../azure/storage/blob/service'
import type { UploadResult } from '../../azure/storage/blob/service'
import { JobsFile } from '../../file/models'
import type { IDomain } from '../../orgDomains/model/IDomain'
import { Job } from '../Job'
import type { JobResult } from '../jobService'
import log from 'log'
import { sendOrgDomainsNotification } from '../../notification/govUKNotify/govUkNotify'
import { createExcelSpreadsheetfromOrgDomainData } from '../../file/excel'
import { groupOrganisationsByDomain } from '../../orgDomains/orgDomainGrouping'
import type { IOrgDomainData } from '../../orgDomains/model/IOrgDomainData'
import type { IFilePath } from '../../orgDomains/model/iFilePath'

export class OrgDomainsJob extends Job {
  protected async runJob (): Promise<JobResult> {
    log.info('Running organisation domains job...')

    log.info('Getting domain and organisation data from the database...')
    const data: IOrgDomainData = await getDataFromDatabase()
    log.info(`Found ${data.allDomains.length} unique domains.`)
    log.info(`Found ${data.organisationDomains.length} organisation/domain pairs.`)

    const organisationsGroupedByDomains: IDomain[] = groupOrganisationsByDomain(data.allDomains, data.organisationDomains)
    log.info('Organisations have been grouped by domain')

    log.info('Creating spreadsheet...')
    const filePath: IFilePath = getFilePath()
    await createExcelSpreadsheetfromOrgDomainData(organisationsGroupedByDomains, filePath.fullPath)
    log.info('Spreadsheet created.')

    log.info('Uploading file ')
    const uploadResult: UploadResult = await uploadFile('orgdomain-files', new JobsFile(filePath.fileName, readFileSync(filePath.fullPath)))

    await sendOrgDomainsNotification('Organisation domains', new Date(), uploadResult)

    return {
      text: `Organisation domains file with name ${filePath.fileName} has been successfully created.`
    }
  }

  public getName (): string {
    return 'Organisation Domains File'
  }
}

const getDataFromDatabase = async (): Promise<IOrgDomainData> => {
  return {
    allDomains: await getAllDomains(),
    organisationDomains: await getOrganisationDomains()
  }
}

const getFilePath = (): IFilePath => {
  const location = '/tmp/'
  const now = new Date()

  const day: string = now.getDate() < 10 ? `0${now.getDate()}` : now.getDate().toString()
  const month: string = (now.getMonth() + 1) < 10 ? `0${(now.getMonth() + 1)}` : (now.getMonth() + 1).toString()
  const year: string = now.getFullYear().toString()

  const dateSuffix = `${day}${month}${year}`

  const fileName: string = `orgDomains-${dateSuffix}.xlsx`

  return {
    location,
    fileName,
    fullPath: `${location}${fileName}`
  }
}
