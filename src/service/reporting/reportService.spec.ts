import * as azureBlobService from '../azure/storage/blob/service'
import * as awsService from '../aws/s3/service'
import * as database from '../../db/shared/database'
import * as zip from '../file/zip'
import * as csv from '../file/csv'
import sinon from 'sinon'
import { JobsFile } from '../file/models'
import { generateCourseCompletionsReportZip, generateOBTStatsAndUploadToS3 } from './reportService'
import { expect } from 'chai'
import * as learnerRecordService from '../learnerRecord/service'

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
      stubs.objsToCsv = sandbox.stub(csv, 'objsToCsv').resolves(fakeCsv)
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
      stubs.objsToCsv = sandbox.stub(csv, 'objsToCsv').resolves(fakeCsv)
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
})
