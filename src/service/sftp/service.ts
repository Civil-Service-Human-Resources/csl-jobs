import { createSftpConnection } from './connection'
import config from '../../config'
import log from 'log'

export const uploadToSftp = async (localFilePath: string, csvFileName: string, sshPrivateKey: string | undefined): Promise<boolean> => {
  const sftp = await createSftpConnection(sshPrivateKey)
  if (sftp !== undefined) {
    const remoteDirectory = config.sftp.skillsSftpRemoteDir
    const remoteFilePath = `${remoteDirectory}/${csvFileName}`
    try {
      log.info(`Uploading ${csvFileName} to sftp remoteFilePath: ${remoteFilePath}...`)
      await sftp.put(localFilePath, remoteFilePath)
      log.info(`File uploaded to sftp remoteFilePath: ${remoteFilePath}`)
      return true
    } catch (err) {
      log.error('Error uploading file to sftp:', err)
      return false
    } finally {
      await sftp.end()
    }
  } else {
    log.info('Either sftp details are not provided or unable to connect to sftp server, therefore csv file is not uploaded.')
    return false
  }
}
