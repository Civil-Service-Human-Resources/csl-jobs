import SftpClient from 'ssh2-sftp-client'
import config from '../../config'
import type sftp from 'ssh2-sftp-client'

export const createSftpConnection = async (sshPrivateKey: string | undefined): Promise<sftp> => {
  const sftp = new SftpClient()

  const connectionConfig = {
    host: config.sftp.skillsSftpHost,
    port: config.sftp.skillsSftpPort,
    username: config.sftp.skillsSftpUsername,
    privateKey: sshPrivateKey
  }

  await sftp.connect(connectionConfig)
  return sftp
}
