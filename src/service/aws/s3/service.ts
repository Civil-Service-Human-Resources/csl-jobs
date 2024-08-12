import { type JobsFile } from '../../file/models'
import log from 'log'
import { getS3Client } from './connection'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const uploadFile = async (bucketName: string, file: JobsFile): Promise<void> => {
  log.debug('Fetching S3 client')
  const s3Client = getS3Client()
  log.debug(`Uploading contents of file ${file.filename} to bucket ${bucketName}`)
  const res = await s3Client.send(new PutObjectCommand(
    {
      Bucket: bucketName,
      Key: file.filename,
      Body: file.contents
    }
  ))
  log.debug(res)
  const resCode = res.$metadata.httpStatusCode ?? 'undefined'
  log.debug(`Upload result: ${resCode}`)
}
