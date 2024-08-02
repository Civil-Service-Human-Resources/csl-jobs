import config from '../../../config'
import { S3Client } from '@aws-sdk/client-s3'

const {
  aws: {
    storage: {
      secretKey,
      accessKey
    }
  }
} = config

export const getS3Client = (): S3Client => {
  return new S3Client({
    region: 'eu-west-2',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
  })
}
