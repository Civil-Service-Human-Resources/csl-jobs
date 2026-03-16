import type sftp from 'ssh2-sftp-client'
import log from 'log'
import SftpClient from 'ssh2-sftp-client'
import { type FtpClient, type FtpClientFactory } from '../ftpClient'

export interface SftpClientOptions {
  host: string
  port: number
  username: string
  privateKey: string
}

export class SftpClientFactory implements FtpClientFactory {
  constructor (protected readonly config: SftpClientOptions) {}

  async createConnection (): Promise<CslSftpClient | undefined> {
    if (Object.values(this.config).includes(undefined)) {
      return undefined
    }

    const sftp = new SftpClient()
    try {
      await sftp.connect(this.config)
      return new CslSftpClient(sftp)
    } catch (err) {
      log.error('Error connecting sftp: ', err)
      await sftp.end()
      return undefined
    }
  }
}

export class CslSftpClient implements FtpClient {
  constructor (private readonly conn: sftp) {}

  async close (): Promise<void> {
    await this.conn.end()
  }

  async upload (localFilePath: string, remoteFilePath: string): Promise<string> {
    return await this.conn.put(localFilePath, remoteFilePath)
  }
}
