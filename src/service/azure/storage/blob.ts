import config from '../../../config'
import { BlobSASPermissions, BlobServiceClient } from '@azure/storage-blob'
import { type JobsFile } from '../../file/models'

export interface UploadResult {
  link: string
  expiryInDays: number
}

const { azure: { storage: { accountConnectionString, blob: { defaultDaysToKeepDownloadLinksActive } } } } = config

const blobServiceClient = BlobServiceClient.fromConnectionString(accountConnectionString)

export const uploadFile = async (containerName: string, file: JobsFile, daysToKeepLinkActive = defaultDaysToKeepDownloadLinksActive): Promise<UploadResult> => {
  const containerClient = blobServiceClient.getContainerClient(containerName)
  await containerClient.createIfNotExists()
  const blobClient = containerClient.getBlockBlobClient(file.filename)
  await blobClient.uploadData(file.contents)
  const expiry = new Date()
  const expiryDate = expiry.getDate() + daysToKeepLinkActive
  expiry.setDate(expiryDate)
  const url = await blobClient.generateSasUrl({
    startsOn: new Date(),
    expiresOn: expiry,
    permissions: BlobSASPermissions.parse('racwd')
  })
  return {
    link: url,
    expiryInDays: daysToKeepLinkActive
  }
}
