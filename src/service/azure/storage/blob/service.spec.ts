import sinon from 'sinon'
import { JobsFile } from '../../../file/models'
import { uploadFile } from './service'
import { expect } from 'chai'
import * as connection from './connection'

const testContainerName = 'container'
const file = new JobsFile('test.csv', Buffer.from('testContents'))

const testDateStr = '2023-01-01 01:01:00'
const testDate = new Date(testDateStr)

describe('Azure blob service tests', () => {
  const sandbox = sinon.createSandbox()
  const blockBlobClient: any = {}
  blockBlobClient.uploadData = sandbox.stub().resolves()
  blockBlobClient.generateSasUrl = sandbox.stub().resolves('URL')
  const containerClient: any = {}
  containerClient.createIfNotExists = sandbox.stub().resolves()
  containerClient.getBlockBlobClient = sandbox.stub().returns(blockBlobClient)
  const blobServiceClient: any = {}
  blobServiceClient.getContainerClient = sandbox.stub().returns(containerClient)
  sandbox.stub(connection, 'getBlobServiceClient').returns(blobServiceClient)
  before(() => {
    sandbox.useFakeTimers(testDate)
  })
  after(() => {
    sandbox.clock.restore()
  })
  describe('UploadFile tests', () => {
    it('Should upload a file and return the SAS download link', async () => {
      const result = await uploadFile(testContainerName, file, 1)
      expect(result.expiryInDays).to.eq(1)
      expect(result.link).to.eq('URL')
      sandbox.assert.calledWith(blobServiceClient.getContainerClient, 'container')
      sandbox.assert.calledOnce(containerClient.createIfNotExists)
      sandbox.assert.calledWith(containerClient.getBlockBlobClient, 'test.csv')
      sandbox.assert.calledWith(blockBlobClient.uploadData, Buffer.from('testContents'))
      sandbox.assert.calledWith(blockBlobClient.generateSasUrl, {
        startsOn: testDate,
        expiresOn: sandbox.match.date,
        permissions: sandbox.match.any
      })
    })
  })
})
