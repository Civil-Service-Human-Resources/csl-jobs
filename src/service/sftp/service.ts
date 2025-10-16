import { createSftpConnection } from './connection'
import config from '../../config'
import log from 'log'

export const uploadToSftp = async (localFilePath: string, csvFileName: string, sshPrivateKey: string | undefined): Promise<void> => {
  const sftp = await createSftpConnection(sshPrivateKey)
  if (sftp !== undefined) {
    const remoteDirectory = config.sftp.skillsSftpRemoteDir
    const remoteFilePath = `${remoteDirectory}/${csvFileName}`
    try {
      log.info(`Uploading ${csvFileName} to ${remoteFilePath}...`)
      await sftp.put(localFilePath, remoteFilePath)
      log.info(`File uploaded to ${remoteFilePath}`)
    } catch (err) {
      log.error('Error uploading file:', err)
    } finally {
      await sftp.end()
    }
  } else {
    log.info('Either sftp details not provided or unable to connect sftp server, therefore csv file is not uploaded.')
  }
}
