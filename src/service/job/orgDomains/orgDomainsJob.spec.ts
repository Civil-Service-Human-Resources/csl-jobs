import * as orgDomainsJob from './orgDomainsJob'
import sinon from 'sinon'
import * as identityDB from '../../../db/identity/database'
import * as sharedDB from '../../../db/shared/database'
import type { IDomain } from '../../orgDomains/model/IDomain'
import type { IOrganisationDomain } from '../../orgDomains/model/IOrganisationDomain'
import * as notifier from '../../notification/govUKNotify/GovUkNotifier'
import * as govUKNotify from '../../notification/govUKNotify/govUkNotify'
import * as ExcelJS from 'exceljs'
import { expect } from 'chai'
import * as excel from '../../file/excel'
import * as zip from '../../file/zip'
import { JobsFile } from '../../file/models'
import { readFileSync } from 'fs'
import * as blobService from '../../azure/storage/blob/service'

class FakeDomain implements IDomain {
  [column: number]: any
  [column: string]: any
  domain: string
  organisations: IOrganisationDomain[]
  ['constructor']: { name: 'RowDataPacket' }
}

class FakeOrganisationDomainPair implements IOrganisationDomain {
  [column: number]: any
  [column: string]: any
  domain: string
  organisation_name: string
  usages: number
  last_logged_in: Date
  ['constructor']: { name: 'RowDataPacket' }
}

describe('orgDomains job tests', () => {
  const orgDomainsSandbox = sinon.createSandbox()

  const notificationClient: any = {}
  notificationClient.infoNotification = orgDomainsSandbox.stub().resolves()
  notificationClient.errorNotification = orgDomainsSandbox.stub().resolves()

  const GovUkNotifier: any = {}

  before(() => {
    GovUkNotifier.send = orgDomainsSandbox.stub().resolves()
    orgDomainsSandbox.stub(notifier, 'getNotifier').returns(GovUkNotifier)
  })
  after(() => {
    orgDomainsSandbox.restore()
  })

  it('should get all domains and organisation-domain pairs from database', async () => {
    const allDomainsDatabaseStub = orgDomainsSandbox.stub(identityDB, 'getAllDomains').resolves([new FakeDomain()])
    const orgDomainsDatabaseStub = orgDomainsSandbox.stub(sharedDB, 'getOrganisationDomains').resolves([new FakeOrganisationDomainPair()])
    await orgDomainsJob.getDataFromDatabase()

    orgDomainsSandbox.assert.calledOnce(allDomainsDatabaseStub)
    orgDomainsSandbox.assert.calledOnce(orgDomainsDatabaseStub)
  })

  it('Should get correct filename for the spreadsheet', () => {
    orgDomainsSandbox.useFakeTimers(new Date('2023-09-29T12:00:00Z'))
    const spreadsheetName: string = orgDomainsJob.getSpreadsheetFileName()
    expect(spreadsheetName).to.equal('orgDomains-29092023.xlsx')
    orgDomainsSandbox.clock.restore()
  })

  it('Should create the spreadsheet with the data', async () => {
    const createExcelSpreadsheetfromOrgDomainDataStub = orgDomainsSandbox.stub(excel, 'createExcelSpreadsheetfromOrgDomainData')
    orgDomainsJob.createSpreadsheet(createFakeDomainData())
    orgDomainsSandbox.assert.calledOnce(createExcelSpreadsheetfromOrgDomainDataStub)
  })

  it('Should store the spreadsheet as a zip file', async () => {
    const zipFilesStub = orgDomainsSandbox.stub(zip, 'zipFiles')
    const workbook = createFakeSpreadsheetWorkbook()
    const content = await workbook.xlsx.writeBuffer()
    await orgDomainsJob.storeSpreadsheetAsZipFile('file1.xlsx', content as Buffer)

    orgDomainsSandbox.assert.calledWith(zipFilesStub, [JobsFile.from('file1.xlsx', content as Buffer)], 'orgDomains.zip')
  })

  it('Should upload zip file to Blob storage', async () => {
    const uploadFileStub = orgDomainsSandbox.stub(blobService, 'uploadFile')
    const jobsFile: JobsFile = JobsFile.from('orgDomains.zip', readFileSync('./src/service/job/orgDomains/test.zip'))
    await orgDomainsJob.uploadZipFileToBlobStorage(jobsFile)

    orgDomainsSandbox.assert.calledWith(uploadFileStub, 'orgdomain-files', jobsFile)
  })

  it('Should send zip file as email', async () => {
    orgDomainsSandbox.useFakeTimers(new Date('2023-10-03T12:00:00Z'))

    const uploadResult: blobService.UploadResult = {
      expiryInDays: 7,
      link: 'https://example.org/file1.zip'
    }

    const sendOrgDomainsNotificationStub = orgDomainsSandbox.stub(govUKNotify, 'sendOrgDomainsNotification')

    await orgDomainsJob.sendZipFileAsEmail(uploadResult)

    orgDomainsSandbox.assert.calledWith(sendOrgDomainsNotificationStub, 'Organisation domains', new Date('2023-10-03T12:00:00Z'), uploadResult)

    orgDomainsSandbox.clock.restore()
  })

  it('Should send password as email', async () => {
    const sendOrgDomainsPasswordNotificationStub = orgDomainsSandbox.stub(govUKNotify, 'sendOrgDomainsPasswordNotification')

    const desription = 'Organisation domains'
    const password = 'abc123'
    await orgDomainsJob.sendPasswordAsEmail(password)

    orgDomainsSandbox.assert.calledWith(sendOrgDomainsPasswordNotificationStub, desription, password)
  })
})

const createFakeDomainData = (): IDomain[] => {
  const domain1: IDomain = new FakeDomain()
  const org1: IOrganisationDomain = new FakeOrganisationDomainPair()
  org1.last_logged_in = new Date()
  domain1.organisations = [org1]

  const domain2: IDomain = new FakeDomain()
  const org2: IOrganisationDomain = new FakeOrganisationDomainPair()
  org2.last_logged_in = new Date()
  domain2.organisations = [org2]

  return [domain1, domain2]
}

const createFakeSpreadsheetWorkbook = (): ExcelJS.Workbook => {
  const workbook: ExcelJS.Workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Organisation domains')

  sheet.getCell('A1').value = 'Test'
  sheet.getCell('A2').value = 67
  return workbook
}
