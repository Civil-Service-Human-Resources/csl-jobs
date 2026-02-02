import { HMRCSkillsJob } from '../../../src/service/job/MI/HMRCSkillsJob'
import { TestNotifier } from '../../util/TestNotifier'
import config from '../../../src/config'
import { createFtpsService } from '../../../src/service/ftp/builder'
import sinon from 'sinon'
import * as db from '../../../src/db/shared/database'
import { TestTableService } from '../../util/TestTableService'
import { expect } from 'chai'
import { NotificationClient } from '../../../src/service/notification/notifications'
import { NOTIFICATION_LEVEL } from '../../../src/service/notification/NotificationLevel'
import * as dateService from '../../../src/service/date/service'
import { CustomDate } from '../../../src/service/date/CustomDate'
import {
  createSkillsExtractEmailStub,
  createSkillsExtractPasswordEmailStub
} from '../../util/stubs/govNotifyStub'
import * as utils from '../../../src/util/utils'
import { NotifyClient } from 'notifications-node-client'
import * as notify from '../../../src/service/notification/govUKNotify/GovUkNotifier'
import { GovUkNotifier } from '../../../src/service/notification/govUKNotify/GovUkNotifier'

const { jobs: { HMRCLearnerRecords } } = config

describe('HMRCSkillsJob', () => {
  const sandbox = sinon.createSandbox()
  const getFakeCompletions = (): any[] => {
    return [
      {
        type: 'Create',
        emailAddress: 'test-email1@cabinetoffice.gov.uk',
        cei: 'cei',
        contentId: 'course1',
        progress: '100',
        isCompleted: 'True',
        result: '',
        timeSpent: 0,
        enrollmentDate: '2024-01-01',
        completionDate: '2025-01-01'
      },
      {
        type: 'create',
        emailAddress: 'test-email2@cabinetoffice.gov.uk',
        cei: 'cei',
        contentId: 'course1',
        progress: '100',
        isCompleted: 'True',
        result: '',
        timeSpent: 0,
        enrollmentDate: '2023-01-01',
        completionDate: '2024-01-01'
      }
    ] as any
  }
  const testDateStr = '2023-01-01 01:01:00'
  const testDate = new CustomDate(testDateStr)

  const testNotifier = new TestNotifier()
  const notificationClient = new NotificationClient([testNotifier], NOTIFICATION_LEVEL.ALL, 'integration-test', 'HMRCSkillsJob')
  const ftpsService = createFtpsService(HMRCLearnerRecords.ftpsConfig)
  const tableService = new TestTableService('testPartition')
  const job = new HMRCSkillsJob(notificationClient, HMRCLearnerRecords, ftpsService, tableService)

  const fakeNotify = new GovUkNotifier(new NotifyClient('govNotifyKey'))

  let databaseStub: sinon.SinonStubbedInstance<typeof db>
  let dateServiceStub: sinon.SinonStubbedInstance<typeof dateService>
  let utilsStub: sinon.SinonStubbedInstance<typeof utils>
  let notifyStub: sinon.SinonStubbedInstance<typeof notify>

  before(async () => {
    notifyStub = sandbox.stub(notify)
    databaseStub = sandbox.stub(db)
    dateServiceStub = sandbox.stub(dateService)
    utilsStub = sandbox.stub(utils)
  })

  beforeEach(async () => {
    await tableService.teardown()
    notifyStub.getNotifier.returns(fakeNotify)
    dateServiceStub.getMidnightToday.returns(testDate)
    utilsStub.generatePassword.returns('Password')
  })
  afterEach(() => {
    sandbox.reset()
  })

  it('should run for an initial sync', async () => {
    await tableService.upsertValueInTable('newEmailIds', 'test-email1@cabinetoffice.gov.uk,test-email2@cabinetoffice.gov.uk')
    databaseStub.getNewSkillsCompletedLearnerRecords.resolves(getFakeCompletions())

    await job.execute()
    expect(await tableService.getValueFromTable('newEmailIds')).to.be.eq(undefined)
    expect(await tableService.getValueFromTable('emailIds')).to.eq('test-email1@cabinetoffice.gov.uk,test-email2@cabinetoffice.gov.uk')
    expect(await tableService.getValueFromTable('lastFileOperation')).to.eq('create')
    expect(await tableService.getValueFromTable('lastFileDate')).to.eq('01012023')
    expect(await tableService.getValueFromTable('lastFileSequenceNumber')).to.eq('1')
    expect(testNotifier.notifications[testNotifier.notifications.length - 1]).to.eq('integration-test | HMRCSkillsJob | Job \'HMRC skills campus extract job\' ran successfully with result message \'Processed 2 new emails\'')
  })

  it('should run for a delta sync', async () => {
    await tableService.upsertValueInTable('lastFileOperation', 'create')
    await tableService.upsertValueInTable('lastFileDate', '01012022')
    await tableService.upsertValueInTable('lastFileSequenceNumber', '1')
    await tableService.upsertValueInTable('emailIds', 'test-email1@cabinetoffice.gov.uk,test-email2@cabinetoffice.gov.uk')
    databaseStub.getDeltaSkillsCompletedLearnerRecords.resolves(getFakeCompletions())

    await job.execute()
    expect(await tableService.getValueFromTable('lastFileOperation')).to.eq('update')
    expect(await tableService.getValueFromTable('lastFileDate')).to.eq('01012023')
    expect(await tableService.getValueFromTable('lastFileSequenceNumber')).to.eq('1')
    expect(testNotifier.notifications[testNotifier.notifications.length - 1]).to.eq('integration-test | HMRCSkillsJob | Job \'HMRC skills campus extract job\' ran successfully with result message \'Processed 2 existing emails\'')
  })

  it('should run for a delta sync in the same day', async () => {
    await tableService.upsertValueInTable('lastFileOperation', 'update')
    await tableService.upsertValueInTable('lastFileDate', '01012023')
    await tableService.upsertValueInTable('lastFileSequenceNumber', '1')
    await tableService.upsertValueInTable('emailIds', 'test-email1@cabinetoffice.gov.uk,test-email2@cabinetoffice.gov.uk')
    databaseStub.getDeltaSkillsCompletedLearnerRecords.resolves(getFakeCompletions())

    await job.execute()
    expect(await tableService.getValueFromTable('lastFileOperation')).to.eq('update')
    expect(await tableService.getValueFromTable('lastFileDate')).to.eq('01012023')
    expect(await tableService.getValueFromTable('lastFileSequenceNumber')).to.eq('2')
    expect(testNotifier.notifications[testNotifier.notifications.length - 1]).to.eq('integration-test | HMRCSkillsJob | Job \'HMRC skills campus extract job\' ran successfully with result message \'Processed 2 existing emails\'')
  })

  it('should run for an initial sync and then a delta sync', async () => {
    await tableService.upsertValueInTable('lastFileOperation', 'update')
    await tableService.upsertValueInTable('lastFileDate', '01012022')
    await tableService.upsertValueInTable('lastFileSequenceNumber', '1')
    await tableService.upsertValueInTable('newEmailIds', 'test-email3@cabinetoffice.gov.uk,test-email4@cabinetoffice.gov.uk')
    await tableService.upsertValueInTable('emailIds', 'test-email1@cabinetoffice.gov.uk,test-email2@cabinetoffice.gov.uk')
    databaseStub.getNewSkillsCompletedLearnerRecords.resolves(getFakeCompletions())
    databaseStub.getDeltaSkillsCompletedLearnerRecords.resolves(getFakeCompletions())

    await job.execute()
    expect(await tableService.getValueFromTable('newEmailIds')).to.be.eq(undefined)
    expect(await tableService.getValueFromTable('emailIds')).to.eq('test-email1@cabinetoffice.gov.uk,test-email2@cabinetoffice.gov.uk,test-email3@cabinetoffice.gov.uk,test-email4@cabinetoffice.gov.uk')
    expect(await tableService.getValueFromTable('lastFileOperation')).to.eq('update')
    expect(await tableService.getValueFromTable('lastFileDate')).to.eq('01012023')
    expect(await tableService.getValueFromTable('lastFileSequenceNumber')).to.eq('2')
    expect(testNotifier.notifications[1]).to.eq('integration-test | HMRCSkillsJob | Skills completion learner record data file \'ER_Create_01012023_1.csv\' successfully uploaded to file server. Data zip file not sent via email because no email recipients are defined.')
    expect(testNotifier.notifications[testNotifier.notifications.length - 1]).to.eq('integration-test | HMRCSkillsJob | Job \'HMRC skills campus extract job\' ran successfully with result message \'Processed 2 new emails, Processed 2 existing emails\'')
  })

  it('should zip reports and send emails when recipients are specified', async () => {
    const emailStubs = [createSkillsExtractPasswordEmailStub('testEmail1@gov.uk', {
      description: 'Skills learner record extract: ER_Create_01012023_1.csv',
      password: 'Password'
    }), createSkillsExtractEmailStub('testEmail1@gov.uk', {
      description: 'Skills learner record extract: ER_Create_01012023_1.csv',
      linkExpiryInDays: 7,
      link: 'http://127.0.0.1:10000/devstoreaccount1/mi-storage/ER_Create_01012023_1.csv.zip'
    })]
    HMRCLearnerRecords.emailRecipients = ['testEmail1@gov.uk']
    const job = new HMRCSkillsJob(notificationClient, HMRCLearnerRecords, ftpsService, tableService)
    await tableService.upsertValueInTable('newEmailIds', 'test-email1@cabinetoffice.gov.uk,test-email2@cabinetoffice.gov.uk')
    databaseStub.getNewSkillsCompletedLearnerRecords.resolves(getFakeCompletions())

    await job.execute()
    expect(await tableService.getValueFromTable('newEmailIds')).to.be.eq(undefined)
    expect(await tableService.getValueFromTable('emailIds')).to.eq('test-email1@cabinetoffice.gov.uk,test-email2@cabinetoffice.gov.uk')
    expect(await tableService.getValueFromTable('lastFileOperation')).to.eq('create')
    expect(await tableService.getValueFromTable('lastFileDate')).to.eq('01012023')
    expect(await tableService.getValueFromTable('lastFileSequenceNumber')).to.eq('1')
    expect(testNotifier.notifications[testNotifier.notifications.length - 1]).to.eq('integration-test | HMRCSkillsJob | Job \'HMRC skills campus extract job\' ran successfully with result message \'Processed 2 new emails\'')
    emailStubs.forEach(s => { s.done() })
  })
})
