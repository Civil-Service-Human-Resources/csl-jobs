import SftpClient from 'ssh2-sftp-client'
import config from '../../config'

export interface SftpConfig {
  host: string
  port: number
  username: string
  password: string
}

export function getSftpConfig (): SftpConfig {
  return {
    host: config.sftp.skillsSftpHost,
    port: config.sftp.skillsSftpPort,
    username: config.sftp.skillsSftpUsername,
    password: config.sftp.skillsSftpPassword
  }
}

export async function createSftpConnection (connectionConfig: SftpConfig = getSftpConfig()
): Promise<SftpClient> {
  const sftp = new SftpClient()
  console.log('Connecting...')
  await sftp.connect(connectionConfig)
}
