import sinon = require('sinon')
import { expect } from 'chai'
import { CourseCompletionsJob } from './CourseCompletionsJob'
import * as govNotifyClient from '../../notification/govUKNotify/govUkNotify'
import * as tableService from '../../azure/storage/table/service'
import * as reportService from '../../reporting/reportService'
import * as dateService from '../../date/service'
import { CustomDate } from '../../date/CustomDate'

const fakeZipUpload = {
  uploadResult: {
    expiryInDays: 1,
    link: 'testLink'
  },
  zip: {
    password: 'testPassword',
    result: {
      contents: Buffer.from('fileContents'),
      filename: 'zip.zip'
    }
  }
}

const testDateStr = '2023-01-01 01:01:00'
const testDate = new CustomDate(testDateStr)

const fakeDuration = 'P1Y'

describe('Test generate course completions', () => {
  const sandbox = sinon.createSandbox()
  const stubs: any = {}
  const notificationClient: any = {}
  notificationClient.infoNotification = sandbox.stub()
  const clearDuplicateTokensJob = new CourseCompletionsJob(notificationClient, fakeDuration)

  before(() => {
    stubs.sendCourseCompletionsNotification = sandbox.stub(govNotifyClient, 'sendCourseCompletionsNotification')
    stubs.sendCourseCompletionsPasswordNotification = sandbox.stub(govNotifyClient, 'sendCourseCompletionsPasswordNotification')
    stubs.getDateFromTable = sandbox.stub(tableService, 'getDateFromTable')
    stubs.upsertJobData = sandbox.stub(tableService, 'upsertJobData')
    stubs.getMidnightToday = sandbox.stub(dateService, 'getMidnightToday')
    stubs.getNewDateFromDateWithDuration = sandbox.stub(dateService, 'getNewDateFromDateWithDuration')
    stubs.generateCourseCompletionsReportZip = sandbox.stub(reportService, 'generateCourseCompletionsReportZip')
  })

  beforeEach(() => {
    sandbox.reset()
  })

  after(() => {
    sandbox.restore()
  })

  it('Should generate a zip and send emails if completions have been found', async () => {
    stubs.sendCourseCompletionsNotification.resolves()
    stubs.sendCourseCompletionsPasswordNotification.resolves()
    stubs.getDateFromTable.resolves(testDate)
    stubs.upsertJobData.resolves()
    stubs.getMidnightToday.returns(testDate)
    stubs.getNewDateFromDateWithDuration.returns(testDate)
    stubs.generateCourseCompletionsReportZip.resolves(fakeZipUpload)
    const result = await clearDuplicateTokensJob.execute()
    expect(result.text).to.eq('Successfully generated and sent course completions file \'zip.zip\'')
    sandbox.assert.calledWith(stubs.generateCourseCompletionsReportZip, testDate, testDate)
    sandbox.assert.calledWith(stubs.sendCourseCompletionsNotification, testDate, testDate, fakeZipUpload.uploadResult)
    sandbox.assert.calledWith(stubs.sendCourseCompletionsPasswordNotification, testDate, testDate, 'testPassword')
    sandbox.assert.calledWith(stubs.getDateFromTable, 'courseCompletions', 'lastReportTimestamp')
    sandbox.assert.calledWith(stubs.upsertJobData, 'courseCompletions', 'lastReportTimestamp', '2023-01-01T01:01:00.000Z')
    sandbox.assert.calledOnce(stubs.getMidnightToday)
    sandbox.assert.notCalled(stubs.getNewDateFromDateWithDuration)
  })

  it('Should NOT generate a zip and send emails if no completions have been found', async () => {
    stubs.getMidnightToday.returns(testDate)
    stubs.generateCourseCompletionsReportZip.resolves(undefined)
    const result = await clearDuplicateTokensJob.execute()
    expect(result.text).to.eq('Found 0 course completions for the specified time period')
    sandbox.assert.calledOnce(stubs.generateCourseCompletionsReportZip)
    sandbox.assert.calledOnce(stubs.getDateFromTable)
    sandbox.assert.calledWith(stubs.getNewDateFromDateWithDuration, testDate, fakeDuration, 'subtract')
    sandbox.assert.notCalled(stubs.sendCourseCompletionsNotification)
    sandbox.assert.notCalled(stubs.sendCourseCompletionsPasswordNotification)
    sandbox.assert.calledWith(stubs.upsertJobData, 'courseCompletions', 'lastReportTimestamp', '2023-01-01T01:01:00.000Z')
    sandbox.assert.calledOnce(stubs.getMidnightToday)
  })
})
