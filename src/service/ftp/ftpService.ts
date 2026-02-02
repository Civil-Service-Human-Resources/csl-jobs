import log from 'log'
import { type FtpClientFactory } from './ftpClient'
import { type JobsFile } from '../file/models'
import { saveFile, unlink } from '../file/fileService'

export class FtpService {
  constructor (private readonly clientFactory: FtpClientFactory) {}

  async uploadFileFromDatafile (dataFile: JobsFile, remoteDir: string): Promise<boolean> {
    const localFilePath = await saveFile(dataFile)
    const remotePath = `${remoteDir}/${dataFile.filename}`
    const uploadResult = await this.uploadFile(localFilePath, remotePath)
    try {
      await unlink(localFilePath)
      log.info(`Deleted temporary file: ${localFilePath}`)
    } catch (err) {
      log.error(`Failed to delete temporary file ${localFilePath}:`, err)
    }
    return uploadResult
  }

  async uploadFile (localFilePath: string, remoteFilePath: string): Promise<boolean> {
    const connection = await this.clientFactory.createConnection()
    if (connection !== undefined) {
      try {
        log.info(`Uploading data file ${localFilePath} remote file path: ${remoteFilePath}...`)
        await connection.upload(localFilePath, remoteFilePath)
        log.info(`Data file uploaded remote file path: ${remoteFilePath}`)
        return true
      } catch (err) {
        log.error('Error uploading data file ', err)
        return false
      } finally {
        await connection.close()
      }
    } else {
      log.info('Either file upload details are not provided or unable to connect server, therefore data file is not uploaded.')
      return false
    }
  }
}
