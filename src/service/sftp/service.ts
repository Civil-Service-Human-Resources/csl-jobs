import { createSftpConnection } from './connection'
import config from '../../config'

async function uploadToSftp (localFile?: string, remoteDir?: string) {
  const sftp = await createSftpConnection()
  const localFilePath = localFile || 'test-file.txt'
  const remoteDirectory = remoteDir || config.sftp.skillsSftpRemoteDir
  const remoteFilePath = `${remoteDirectory}/${localFilePath}`
  try {
    console.log(`Uploading ${localFilePath} to ${remoteFilePath}...`)
    await sftp.put(localFilePath, remoteFilePath)
    console.log(`File uploaded to ${remoteFilePath}`)
  } catch (err) {
    console.error('Error uploading file:', err)
  } finally {
    sftp.end()
  }
}
