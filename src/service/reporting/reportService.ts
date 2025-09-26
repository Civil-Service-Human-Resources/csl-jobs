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
import * as fs from 'fs/promises'
import path from 'path'
import log from 'log'
import config from '../../config'
import { type CustomDate } from '../date/CustomDate'
import * as tableService from '../azure/storage/table/service'
import os from 'os'

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

export const generateSkillsCompletedLearnerRecordsAndUploadToSftp = async (lastSuccessTimestamp: CustomDate | undefined):
Promise<{ csvFile: JobsFile }> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const emailIds = (await tableService.getJobData('skillsSync', 'emailIds')).split(',')
  let csvFilenamePrefix
  if (lastSuccessTimestamp === undefined) {
    csvFilenamePrefix = config.jobs.skillsCompletedLearnerRecords.csvFilenamePrefixCreate
  } else {
    csvFilenamePrefix = config.jobs.skillsCompletedLearnerRecords.csvFilenamePrefixUpdate
  }
  const csvFileName = getCurrentDateFileName(csvFilenamePrefix) + '.csv'
  log.info(`csvFileName: ${csvFileName}`)
  const completions = await getSkillsCompletedLearnerRecords(emailIds, lastSuccessTimestamp)
  const csvFileContents = await objsToCsv(completions.length > 0 ? completions : [])
  const csvFile = JobsFile.from(`${csvFileName}`, csvFileContents)

  // Storing the csv file in blob storage for the record
  await uploadFile(csvFile)
  log.info(`csv file uploaded to Azure Blob Storage: ${csvFileName}`)

  // Write to local folder
  const localTempDir = os.tmpdir()
  const localFilePath = path.join(localTempDir, csvFileName)
  await fs.writeFile(localFilePath, csvFile.contents, 'utf8')
  log.info(`Local temporary file written: ${localFilePath}`)

  const sshPrivateKey = await tableService.getJobData('skillsSync', 'sshPrivateKey')
  // Upload to SFTP
  await uploadToSftp(localFilePath, csvFileName, sshPrivateKey)

  // Delete the CSV file from the tmp folder
  try {
    await fs.unlink(localFilePath)
    log.info(`Deleted temporary file: ${localFilePath}`)
  } catch (err) {
    log.error(`Failed to delete temporary file ${localFilePath}:`, err)
  }
  return { csvFile }
}

export const getTimeRangeFileName = (key: string, startTimestamp: Date, endTimestamp: Date): string => {
  const formatTokens = 'DD_MM_YYYY'
  const startFmt = dayjs(startTimestamp).format(formatTokens)
  const endFmt = dayjs(endTimestamp).format(formatTokens)
  return `${key}_${startFmt}_to_${endFmt}`
}

export const getCurrentDateFileName = (key: string): string => {
  const formatTokens = 'DDMMYYYY'
  const currentFmt = dayjs().format(formatTokens)
  return `${key}_${currentFmt}`
}
