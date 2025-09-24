import SftpClient from 'ssh2-sftp-client'
import config from '../../config'
// import * as fs from 'fs'
import log from 'log'

export interface SftpConfig {
  host: string
  port: number
  username: string
  password: string
  // privateKey: Buffer
}

export function getSftpConfig (): SftpConfig {
  return {
    host: config.sftp.skillsSftpHost,
    port: config.sftp.skillsSftpPort,
    username: config.sftp.skillsSftpUsername,
    password: config.sftp.skillsSftpPassword
    // privateKey: fs.readFileSync('/ssh/id_ed25519')
  }
}

export async function createSftpConnection (connectionConfig: SftpConfig = getSftpConfig()
): Promise<SftpClient> {
  const sftp = new SftpClient()
  log.info('Connecting...')
  await sftp.connect(connectionConfig)
  return sftp
}
