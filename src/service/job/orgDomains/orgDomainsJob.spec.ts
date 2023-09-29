import { expect } from 'chai'
import * as orgDomainsJob from './orgDomainsJob'
import sinon from 'sinon'
import * as identityDB from '../../../db/identity/database'
import * as sharedDB from '../../../db/shared/database'
import { OrgDomainsJob } from './orgDomainsJob'
import * as excel from '../../file/excel'
import type { IDomain } from '../../orgDomains/model/IDomain'
import type { IOrganisationDomain } from '../../orgDomains/model/IOrganisationDomain'
import type { IOrgDomainData } from '../../orgDomains/model/IOrgDomainData'
import * as notifier from '../../notification/govUKNotify/GovUkNotifier'
import { GovUkEmailNotification } from '../../notification/govUKNotify/GovUkEmailNotification'
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

describe('orgDomains job', () => {
  const orgDomainsSandbox = sinon.createSandbox()

  const notificationClient: any = {}
  notificationClient.infoNotification = orgDomainsSandbox.stub().resolves()
  notificationClient.errorNotification = orgDomainsSandbox.stub().resolves()
  const job = new OrgDomainsJob(notificationClient)

  const GovUkNotifier: any = {}

  beforeEach(() => {
    orgDomainsSandbox.useFakeTimers(new Date('2023-09-29T12:00:00Z'))
    GovUkNotifier.send = orgDomainsSandbox.stub().resolves()
    orgDomainsSandbox.stub(notifier, 'getNotifier').returns(GovUkNotifier)
  })
  afterEach(() => {
    orgDomainsSandbox.clock.restore()
    orgDomainsSandbox.restore()
  })

  it('should return relevant file paths when getPath is called', () => {
    const filePath = orgDomainsJob.getFilePath()

    expect(filePath.location).to.equal('/tmp/')
    expect(filePath.fileName).to.equal('orgDomains-29092023.xlsx')
    expect(filePath.fullPath).to.equal('/tmp/orgDomains-29092023.xlsx')
  })

  it('should get all domains and organisation-domain pairs from database when getDataFromDatabase is called', async () => {
    const allDomainsDatabaseStub = orgDomainsSandbox.stub(identityDB, 'getAllDomains')
    const orgDomainsDatabaseStub = orgDomainsSandbox.stub(sharedDB, 'getOrganisationDomains')
    await orgDomainsJob.getDataFromDatabase()

    orgDomainsSandbox.assert.calledOnce(allDomainsDatabaseStub)
    orgDomainsSandbox.assert.calledOnce(orgDomainsDatabaseStub)
  })

  it('Should send an email using GovNotify with correct template and personalisation', async () => {
    const fakeDbData: IOrgDomainData = {
      allDomains: [new FakeDomain()],
      organisationDomains: [new FakeOrganisationDomainPair()]
    }

    orgDomainsSandbox.stub(orgDomainsJob, 'getDataFromDatabase').resolves(fakeDbData)
    orgDomainsSandbox.stub(excel, 'createExcelSpreadsheetfromOrgDomainData')
    orgDomainsSandbox.stub(orgDomainsJob, 'uploadSpreadsheet').resolves({
      link: '/link/1',
      expiryInDays: 7
    })

    await job.execute()

    orgDomainsSandbox.assert.calledWith(GovUkNotifier.send, orgDomainsSandbox.match.instanceOf(GovUkEmailNotification), {
      description: 'Organisation domains',
      date: '29/09/2023',
      link: '/link/1',
      daysUntilExpiry: 7
    })
  })
})
