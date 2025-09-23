import { createSftpConnection } from './connection'
import config from '../../config'

export const uploadToSftp = async (csvFile: string): Promise<void> => {
  const sftp = await createSftpConnection()
  const remoteDirectory = config.sftp.skillsSftpRemoteDir
  const remoteFilePath = `${remoteDirectory}/${csvFile}`
  try {
    console.log(`Uploading ${csvFile} to ${remoteFilePath}...`)
    await sftp.put(csvFile, remoteFilePath)
    console.log(`File uploaded to ${remoteFilePath}`)
  } catch (err) {
    console.error('Error uploading file:', err)
  } finally {
    await sftp.end()
  }
}
