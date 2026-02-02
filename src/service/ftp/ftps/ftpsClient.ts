import log from 'log'
import { type FtpClient } from '../ftpClient'
import { type Client } from 'basic-ftp'
import { type ConnectionOptions as TLSConnectionOptions } from 'tls'
import * as ftp from 'basic-ftp'
import config from '../../../config'

export interface FtpsClientOptions {
  host: string
  user: string
  port: number
  password: string
  secureOptions?: TLSConnectionOptions
}

export class FtpsClientFactory implements FtpsClientFactory {
  constructor (protected readonly config: FtpsClientOptions) { }

  async createConnection (): Promise<FtpsClient | undefined> {
    const client = new ftp.Client()
    if (Object.values(this.config).includes(undefined)) {
      return undefined
    }
    try {
      if (config.logLevel === 'debug') {
        client.ftp.verbose = true
      }
      this.config.secureOptions = { rejectUnauthorized: this.config.host !== 'localhost' }
      await client.access({
        ...this.config,
        secure: true
      })
      return new FtpsClient(client)
    } catch (err) {
      log.error('Error connecting ftp: ', err)
      client.close()
      return undefined
    }
  }
}

export class FtpsClient implements FtpClient {
  constructor (private readonly conn: Client) {}

  async close (): Promise<void> {
    this.conn.close()
  }

  async upload (localFilePath: string, remoteFilePath: string): Promise<string> {
    const resp = await this.conn.uploadFrom(localFilePath, remoteFilePath)
    return resp.message
  }
}
