import config from '../../../../config'
import { BlobSASPermissions } from '@azure/storage-blob'
import { type JobsFile } from '../../../file/models'
import log from 'log'
import { getBlobServiceClient } from './connection'

export interface UploadResult {
  link: string
  expiryInDays: number
}

const { azure: { storage: { blob: { defaultDaysToKeepDownloadLinksActive } } } } = config

export const uploadFile = async (containerName: string, file: JobsFile, daysToKeepLinkActive = defaultDaysToKeepDownloadLinksActive): Promise<UploadResult> => {
  const blobServiceClient = getBlobServiceClient()
  log.debug(`Fetching blob container client '${containerName}'`)
  const containerClient = blobServiceClient.getContainerClient(containerName)
  await containerClient.createIfNotExists()
  log.debug(`Fetching blob client '${file.filename}'`)
  const blobClient = containerClient.getBlockBlobClient(file.filename)
  log.debug('Uploading contents')
  await blobClient.uploadData(file.contents)
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + daysToKeepLinkActive)
  log.debug('Generating SAS URL')
  const url = await blobClient.generateSasUrl({
    startsOn: new Date(),
    expiresOn: expiry,
    permissions: BlobSASPermissions.parse('r')
  })
  return {
    link: url,
    expiryInDays: daysToKeepLinkActive
  }
}
