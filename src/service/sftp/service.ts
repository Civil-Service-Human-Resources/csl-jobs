import { createSftpConnection } from './connection'
import config from '../../config'
import log from 'log'

export const uploadToSftp = async (csvFile: string): Promise<void> => {
  const sftp = await createSftpConnection()
  const remoteDirectory = config.sftp.skillsSftpRemoteDir
  const remoteFilePath = `${remoteDirectory}/${csvFile}`
  try {
    log.info(`Uploading ${csvFile} to ${remoteFilePath}...`)
    await sftp.put(csvFile, remoteFilePath)
    log.info(`File uploaded to ${remoteFilePath}`)
  } catch (err) {
    log.error('Error uploading file:', err)
  } finally {
    await sftp.end()
  }
}
