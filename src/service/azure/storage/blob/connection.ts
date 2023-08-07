import config from '../../../../config'
import { BlobServiceClient } from '@azure/storage-blob'
const { azure: { storage: { accountConnectionString } } } = config

export const getBlobServiceClient = (): BlobServiceClient => {
  return BlobServiceClient.fromConnectionString(accountConnectionString)
}
