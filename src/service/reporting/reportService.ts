import * as azureBlobService from '../azure/storage/blob/service'
import { type UploadResult } from '../azure/storage/blob/service'
import { JobsFile } from '../file/models'
import { getCompletedCourseRecords, getSkillsCompletedLearnerRecords } from '../../db/shared/database'
import { objsToCsv } from '../file/csv'
import { type EncryptedZipResult, zipFiles } from '../file/zip'
import dayjs from 'dayjs'
import * as learnerRecordService from '../learnerRecord/service'
import * as awsService from '../aws/s3/service'
import { uploadToSftp } from '../sftp/service'
// import * as fs from 'fs/promises'
// import path from 'path'

const MI_BLOB_CONTAINER = 'mi-storage'

interface UploadedZipReport {
  zip: EncryptedZipResult
  uploadResult: UploadResult
}

const uploadFile = async (file: JobsFile): Promise<UploadResult> => {
  return await azureBlobService.uploadFile(MI_BLOB_CONTAINER, file)
}

export const generateOBTStatsAndUploadToS3 = async (
  from: Date, to: Date, courseIds: string[],
  s3Directory: string, s3BucketAlias: string): Promise<string> => {
  const data = await learnerRecordService.getFormattedCourseRecords(from, to, courseIds)
  let resp = 'No OBT data to send'
  if (data.length > 0) {
    const fileName = getTimeRangeFileName('obt_stats', from, to)
    const csv = await objsToCsv(data)
    const csvFile = JobsFile.from(`${s3Directory}/${fileName}.csv`, csv)
    await awsService.uploadFile(s3BucketAlias, csvFile)
    resp = `Successfully generated and uploaded OBT file '${fileName}' to S3`
  }
  return resp
}

export const generateCourseCompletionsReportZip = async (lastSuccessTimestamp: Date, toTimestamp: Date): Promise<UploadedZipReport | undefined> => {
  const completions = await getCompletedCourseRecords(lastSuccessTimestamp, toTimestamp)
  if (completions.length > 0) {
    const fileName = getTimeRangeFileName('course_completions', lastSuccessTimestamp, toTimestamp)
    const csv = await objsToCsv(completions)
    const csvFile = JobsFile.from(`${fileName}.csv`, csv)
    const zipFile = await zipFiles([csvFile], fileName)
    const uploadResult = await uploadFile(zipFile.result)
    return {
      zip: zipFile,
      uploadResult
    }
  } else {
    return undefined
  }
}

export const generateSkillsCompletedLearnerRecordsAndUploadToSftp = async (emailIds: string[], lastSuccessTimestamp: Date, toTimestamp: Date):
Promise<{ csvFile: JobsFile }> => {
  const completions = await getSkillsCompletedLearnerRecords(emailIds, lastSuccessTimestamp)
  const fileName = getTimeRangeFileName('skills_completed_lr', lastSuccessTimestamp, toTimestamp)
  const csv = await objsToCsv(completions.length > 0 ? completions : [])
  const csvFile = JobsFile.from(`${fileName}.csv`, csv)

  // If local tmp directory to be used
  // const localFilePath = path.join('/tmp', csvFile.filename)
  // await fs.writeFile(localFilePath, csvFile.contents, 'utf8')
  // await uploadToSftp(localFilePath)

  // If azure blob storage to be used
  const uploadResult = await uploadFile(csvFile)
  await uploadToSftp(uploadResult.link)

  return { csvFile }
}

export const getTimeRangeFileName = (key: string, startTimestamp: Date, endTimestamp: Date): string => {
  const formatTokens = 'DD_MM_YYYY'
  const startFmt = dayjs(startTimestamp).format(formatTokens)
  const endFmt = dayjs(endTimestamp).format(formatTokens)
  return `${key}_${startFmt}_to_${endFmt}`
}
