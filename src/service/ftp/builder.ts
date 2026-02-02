import { FtpService } from './ftpService'
import { FtpsClientFactory, type FtpsClientOptions } from './ftps/ftpsClient'
import { SftpClientFactory, type SftpClientOptions } from './sftp/sftpClient'

export const createFtpsService = (config: FtpsClientOptions): FtpService => {
  return new FtpService(new FtpsClientFactory(config))
}

export const createSftpService = (config: SftpClientOptions): FtpService => {
  return new FtpService(new SftpClientFactory(config))
}
