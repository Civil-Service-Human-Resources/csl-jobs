import SftpClient from 'ssh2-sftp-client'
import config from '../../config'
import type sftp from 'ssh2-sftp-client'
import log from 'log'

export const createSftpConnection = async (sshPrivateKey: string | undefined): Promise<sftp | undefined> => {
  const sftp = new SftpClient()

  const connectionConfig = {
    host: config.sftp.skillsSftpHost,
    port: config.sftp.skillsSftpPort,
    username: config.sftp.skillsSftpUsername,
    privateKey: sshPrivateKey
  }
  if (Object.values(connectionConfig).includes(undefined)) {
    return undefined
  }

  try {
    await sftp.connect(connectionConfig)
    return sftp
  } catch (err) {
    log.error('Error connecting sftp: ', err)
    await sftp.end()
    return undefined
  }
}
