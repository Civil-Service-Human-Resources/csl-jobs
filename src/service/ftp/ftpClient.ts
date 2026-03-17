export interface FtpClient {
  close: () => Promise<void>
  upload: (localFilePath: string, remoteFilePath: string) => Promise<string>
}

export interface FtpClientFactory {
  createConnection: () => Promise<FtpClient | undefined>
}
