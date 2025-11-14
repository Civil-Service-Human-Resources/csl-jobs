import * as azureBlobService from '../azure/storage/blob/service'
import * as awsService from '../aws/s3/service'
import * as database from '../../db/shared/database'
import * as zip from '../file/zip'
import * as delimited from '../file/delimited'
import sinon from 'sinon'
import { JobsFile } from '../file/models'
import { generateCourseCompletionsReportZip, generateOBTStatsAndUploadToS3, generateSkillsCompletedLearnerRecordsAndUploadToSftp } from './reportService'
import { expect } from 'chai'
import * as learnerRecordService from '../learnerRecord/service'
import * as tableService from '../azure/storage/table/service'
import * as govNotifyClient from '../notification/govUKNotify/govUkNotify'
import * as fileService from '../file/fileService'
import * as uploadToSftp from '../sftp/service'

const fakeCourseCompletionRow = {
  user_id: 'user_id',
  full_name: 'full_name',
  email: 'email',
  organisation: 'organisation',
  organisation_id: 'organisation_id',
  organisation_code: 'organisation_code',
  profession: 'profession',
  course_id: 'course_id',
  course_title: 'course_title',
  state: 'state',
  last_updated: 'last_updated',
  is_required: true
}

const fakeSkillsLearnerRecord = {
  type: 'Create',
  emailAddress: 'abc@xyz.com',
  cei: '',
  contentId: 'EBRBYRDfSoCJr75cxd2SQA',
  progress: '100',
  isCompleted: 'True',
  result: '',
  timeSpent: 30542651,
  enrollmentDate: '2023-04-28',
  completionDate: '024-04-16'
}

const fakeFile = new JobsFile('test.zip', Buffer.from('contents'))
const fakeZipResult: zip.EncryptedZipResult = {
  result: fakeFile,
  password: 'password'
}
const fakeUploadResult: azureBlobService.UploadResult = {
  link: 'URL',
  expiryInDays: 1
}

const fakeCsv = 'test_key,test_id\n"test","1"'

const testDate = new Date('2023-01-01 01:01:00')

describe('Report service tests', () => {
  const sandbox = sinon.createSandbox()
  describe('Generate OBT stats tests', () => {
    const stubs: any = {}
    before(() => {
      stubs.getFormattedCourseRecords = sandbox.stub(learnerRecordService, 'getFormattedCourseRecords').resolves([{} as any])
      stubs.objsToCsv = sandbox.stub(delimited, 'objsToCsv').resolves(fakeCsv)
      stubs.uploadFile = sandbox.stub(awsService, 'uploadFile').resolves()
    })
    after(() => {
      sandbox.restore()
    })
    it('should upload a csv file to S3 when completion rows have been found', async () => {
      const res = await generateOBTStatsAndUploadToS3(testDate, testDate, ['courseId'], 's3Dir', 's3Bucket')
      sandbox.assert.calledWith(stubs.getFormattedCourseRecords, testDate, testDate, ['courseId'])
      sandbox.assert.calledWith(stubs.objsToCsv, [{} as any])
      expect(res).to.eql('Successfully generated and uploaded OBT file \'obt_stats_01_01_2023_to_01_01_2023\' to S3')
    })
  })
  describe('Generate course completions tests', () => {
    const stubs: any = {}
    before(() => {
      stubs.getCompletedCourseRecords = sandbox.stub(database, 'getCompletedCourseRecords').resolves([fakeCourseCompletionRow as any])
      stubs.objsToCsv = sandbox.stub(delimited, 'objsToCsv').resolves(fakeCsv)
      stubs.zipFiles = sandbox.stub(zip, 'zipFiles').resolves(fakeZipResult)
      stubs.uploadFile = sandbox.stub(azureBlobService, 'uploadFile').resolves(fakeUploadResult)
    })
    after(() => {
      sandbox.restore()
    })
    it('should generate a zip file when completion rows have been found', async () => {
      const res = await generateCourseCompletionsReportZip(testDate, testDate)
      expect(res?.zip.password).to.equal('password')
      expect(res?.zip.result.filename).to.equal('test.zip')
      expect(res?.uploadResult.expiryInDays).to.equal(1)
      expect(res?.uploadResult.link).to.equal('URL')

      sandbox.assert.calledWith(stubs.getCompletedCourseRecords, testDate, testDate)
      sandbox.assert.calledWith(stubs.objsToCsv, [fakeCourseCompletionRow])
      const zipFilesArgs = stubs.zipFiles.args[0]
      expect(zipFilesArgs[0][0].filename).to.equal('course_completions_01_01_2023_to_01_01_2023.csv')
      expect(zipFilesArgs[1]).to.equal('course_completions_01_01_2023_to_01_01_2023')
      sandbox.assert.calledWith(stubs.uploadFile, 'mi-storage', fakeFile)
    })
  })
  describe('Skills Completion Learner Record Test', () => {
    const emailIds = 'abc1@xyz.com,abc2@xyz.com'
    const stubs: any = {}
    const notificationClient: any = {}
    notificationClient.infoNotification = sandbox.stub()
    before(() => {
      const stubGetJobData = sandbox.stub(tableService, 'getJobData')
      stubGetJobData.withArgs('skillsSync', 'lastFileOperation').resolves('Create')
      stubGetJobData.withArgs('skillsSync', 'lastFileDate').resolves('2025-01-01')
      stubGetJobData.withArgs('skillsSync', 'lastFileSequenceNumber').resolves('')
      stubGetJobData.withArgs('skillsSync', 'emailIds').resolves(emailIds)
      stubGetJobData.withArgs('skillsSync', 'sshPrivateKey').resolves('some-value')
      stubs.getDateFromTable = sandbox.stub(tableService, 'getDateFromTable')
      stubs.getSkillsCompletedLearnerRecords = sandbox.stub(database, 'getSkillsCompletedLearnerRecords').resolves([fakeSkillsLearnerRecord as any])
      stubs.objsToDelimited = sandbox.stub(delimited, 'objsToDelimited').resolves(fakeCsv)
      stubs.uploadFile = sandbox.stub(azureBlobService, 'uploadFile').resolves(fakeUploadResult)
      stubs.writeFile = sandbox.stub(fileService, 'writeFile').resolves()
      stubs.uploadToSftp = sandbox.stub(uploadToSftp, 'uploadToSftp').resolves(true)
      stubs.unlink = sandbox.stub(fileService, 'unlink').resolves()
      stubs.zipFiles = sandbox.stub(zip, 'zipFiles').resolves(fakeZipResult)
      stubs.sendSkillsFileNotification = sandbox.stub(govNotifyClient, 'sendSkillsFileNotification')
      stubs.sendSkillsFilePasswordNotification = sandbox.stub(govNotifyClient, 'sendSkillsFilePasswordNotification')
      stubs.upsertJobData = sandbox.stub(tableService, 'upsertJobData')
    })
    after(() => {
      sandbox.restore()
    })
    it('Should run successfully', async () => {
      const res = await generateSkillsCompletedLearnerRecordsAndUploadToSftp('skillsSync')
      expect(res).to.contain('Skills completion learner record csv file \'ER_Create_')
      expect(res).to.contain('1.csv\' successfully uploaded to sftp server.')
      expect(res).to.contain(' Csv zip file not sent via email because no email recipients are defined.')
      sandbox.assert.calledWith(stubs.getSkillsCompletedLearnerRecords, ['abc1@xyz.com', 'abc2@xyz.com'], undefined)
      sandbox.assert.calledWith(stubs.objsToDelimited, [fakeSkillsLearnerRecord])
    })
  })
})
