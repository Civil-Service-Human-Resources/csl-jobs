import { createSftpConnection } from './connection'
import config from '../../config'
import log from 'log'

export const uploadToSftp = async (localFilePath: string, dataFileName: string, sshPrivateKey: string | undefined): Promise<boolean> => {
  const sftp = await createSftpConnection(sshPrivateKey)
  if (sftp !== undefined) {
    const remoteDirectory = config.sftp.skillsSftpRemoteDir
    const remoteFilePath = `${remoteDirectory}/${dataFileName}`
    try {
      log.info(`Uploading data file ${dataFileName} to sftp remote file path: ${remoteFilePath}...`)
      await sftp.put(localFilePath, remoteFilePath)
      log.info(`Data file uploaded to sftp remote file path: ${remoteFilePath}`)
      return true
    } catch (err) {
      log.error('Error uploading data file to sftp:', err)
      return false
    } finally {
      await sftp.end()
    }
  } else {
    log.info('Either sftp details are not provided or unable to connect to sftp server, therefore data file is not uploaded.')
    return false
  }
}
