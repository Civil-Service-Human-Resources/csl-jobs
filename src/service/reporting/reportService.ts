import * as azureBlobService from '../azure/storage/blob/service'
import { type UploadResult } from '../azure/storage/blob/service'
import { JobsFile } from '../file/models'
import { getCompletedCourseRecords, getSkillsCompletedLearnerRecords } from '../../db/shared/database'
import { objsToCsv, objsToDelimited } from '../file/delimited'
import { type EncryptedZipResult, zipFiles } from '../file/zip'
import dayjs from 'dayjs'
import * as learnerRecordService from '../learnerRecord/service'
import * as awsService from '../aws/s3/service'
import { uploadToSftp } from '../sftp/service'
import { unlink, writeFile } from '../file/fileService'
import path from 'path'
import log from 'log'
import config from '../../config'
import * as tableService from '../azure/storage/table/service'
import os from 'os'
import * as govNotifyClient from '../notification/govUKNotify/govUkNotify'

const MI_BLOB_CONTAINER = 'mi-storage'

interface UploadedZipReport {
  zip: EncryptedZipResult
  uploadResult: UploadResult
}

interface SkillsCompletedLearnerRecordsFileDetails {
  operation: string | undefined
  date: string | undefined
  sequenceNumber: string | undefined
}

export const uploadFile = async (file: JobsFile): Promise<UploadResult> => {
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

export const generateSkillsCompletedLearnerRecordsAndUploadToSftp = async (tablePartitionKey: string): Promise<string> => {
  const currentTimeStamp = new Date().toISOString()
  log.info(`Skills data extract timestamp: '${currentTimeStamp}'`)
  const lastFile: SkillsCompletedLearnerRecordsFileDetails = {
    operation: await tableService.getJobData(tablePartitionKey, 'lastFileOperation'),
    date: await tableService.getJobData(tablePartitionKey, 'lastFileDate'),
    sequenceNumber: await tableService.getJobData(tablePartitionKey, 'lastFileSequenceNumber')
  }
  let sftpUploadSuccess = true
  let emailSentSuccess = true

  const lastReportTimestamp = await tableService.getDateFromTable(tablePartitionKey, 'lastReportTimestamp')
  // Defining data filename
  const newFormattedDate = dayjs().format('DDMMYYYY')
  const newSequenceNumber = ((lastFile.sequenceNumber != null) && (lastFile.date != null) && newFormattedDate === lastFile.date) ? parseInt(lastFile.sequenceNumber) + 1 : 1
  lastFile.date = newFormattedDate
  lastFile.sequenceNumber = newSequenceNumber.toString()
  let dataFilenamePrefix: string
  if (lastReportTimestamp === undefined) {
    dataFilenamePrefix = config.jobs.skillsCompletedLearnerRecords.dataFilenamePrefixCreate
    lastFile.operation = 'create'
  } else {
    dataFilenamePrefix = config.jobs.skillsCompletedLearnerRecords.dataFilenamePrefixUpdate
    lastFile.operation = 'update'
  }
  const dataFilenameExtension = config.jobs.skillsCompletedLearnerRecords.dataFilenameExtension
  const dataFileName = getSkillsDataFilename(dataFilenamePrefix, dataFilenameExtension, lastFile)
  log.info(`Skills data file name: ${dataFileName}`)
  const emailIdsFromTS = await tableService.getJobData(tablePartitionKey, 'emailIds')
  const emailIds = emailIdsFromTS !== undefined ? emailIdsFromTS.split(',') : []
  const completions = await getSkillsCompletedLearnerRecords(emailIds, lastReportTimestamp)
  const dataFileDelimiter = config.jobs.skillsCompletedLearnerRecords.dataFileDelimiter
  log.info(`Skills data file delimiter: ${dataFileDelimiter}`)
  const dataFileContents = await objsToDelimited(completions.length > 0 ? completions : [], dataFileDelimiter)
  const dataFile = JobsFile.from(`${dataFileName}`, dataFileContents)

  let resultText: string
  // if data file is blank and not allowed to send then do not process further
  if (completions.length <= 0 && !config.jobs.skillsCompletedLearnerRecords.sendBlankDataFile) {
    log.info('Skills data not found. Blank skills completion learner record data file is not allowed to send, therefore it is not generated.')
    resultText = 'Data not found. Blank skills completion learner record data file is not allowed to send, therefore it is not generated.'
    return resultText
  }

  // Storing the data file in blob storage for the record
  await uploadFile(dataFile)
  log.info(`Skills data file uploaded to Azure Blob Storage: ${dataFileName}`)

  // Write to local folder
  const localTempDir = os.tmpdir()
  const localFilePath = path.join(localTempDir, dataFileName)
  await writeFile(localFilePath, dataFile.contents, 'utf8')
  log.info(`Skills local temporary file written: ${localFilePath}`)

  const sshPrivateKey = await tableService.getJobData(tablePartitionKey, 'sshPrivateKey')

  // Upload to SFTP
  const sftpUploadResult = await uploadToSftp(localFilePath, dataFileName, sshPrivateKey)
  if (sftpUploadResult) {
    log.info(`Skills completion learner record data file '${dataFile.filename}' successfully uploaded to sftp server.`)
    resultText = `Skills completion learner record data file '${dataFile.filename}' successfully uploaded to sftp server.`
  } else {
    sftpUploadSuccess = false
    log.info(`Skills completion learner record data file '${dataFile.filename}' sftp upload FAILED.`)
    resultText = `Skills completion learner record data file '${dataFile.filename}' sftp upload FAILED.`
  }

  // Delete the data file from the tmp folder
  try {
    await unlink(localFilePath)
    log.info(`Skills - Deleted temporary file: ${localFilePath}`)
  } catch (err) {
    log.error(`Skills - Failed to delete temporary file ${localFilePath}:`, err)
  }

  log.info(`config.jobs.skillsCompletedLearnerRecords.emailRecipients.length: '${config.jobs.skillsCompletedLearnerRecords.emailRecipients.length}'`)
  if (config.jobs.skillsCompletedLearnerRecords.emailRecipients.length > 0) {
    log.debug(`config.jobs.skillsCompletedLearnerRecords.emailRecipients: '${config.jobs.skillsCompletedLearnerRecords.emailRecipients.toString()}'`)
    log.debug('Skills - Creating zip file to be sent by email')
    const zipFile = await zipFiles([dataFile], dataFile.filename)
    const uploadResult = await uploadFile(zipFile.result)
    log.info(`Skills zip file '${zipFile.result.filename}' is created and uploaded to Azure blob storage`)
    const description = `Skills learner record extract: ${dataFile.filename}`
    await Promise.all([govNotifyClient.sendSkillsFileNotification(uploadResult, description),
      govNotifyClient.sendSkillsFilePasswordNotification(zipFile.password, description)]
    )
    log.info(`Skills zip File '${zipFile.result.filename}' successfully sent via email to: '${config.jobs.skillsCompletedLearnerRecords.emailRecipients.toString()}'`)
    resultText = resultText + ` Zip file '${zipFile.result.filename}' successfully sent via email.`
  } else {
    emailSentSuccess = false
    log.info('Skills data zip file not sent via email because no email recipients are defined.')
    resultText = resultText + ' Data zip file not sent via email because no email recipients are defined.'
  }

  if (sftpUploadSuccess || emailSentSuccess) {
    // Update Azure storage table entries
    await tableService.upsertJobData(tablePartitionKey, 'lastFileOperation', lastFile.operation)
    await tableService.upsertJobData(tablePartitionKey, 'lastFileDate', lastFile.date)
    await tableService.upsertJobData(tablePartitionKey, 'lastFileSequenceNumber', lastFile.sequenceNumber.toString())
    await tableService.upsertJobData(tablePartitionKey, 'lastReportTimestamp', currentTimeStamp)
    log.info(`Skills lastReportTimestamp is updated in the '${tablePartitionKey}' Azure partition: '${currentTimeStamp}'`)
    log.info(`Skills completion learner record data file '${dataFile.filename}' successfully generated and processed.`)
  } else {
    log.info(`Skills lastReportTimestamp not updated in the '${tablePartitionKey}' Azure partition because neither the data file uploaded to sftp nor zip file sent via email.`)
  }

  return resultText
}

export const getTimeRangeFileName = (key: string, startTimestamp: Date, endTimestamp: Date): string => {
  const formatTokens = 'DD_MM_YYYY'
  const startFmt = dayjs(startTimestamp).format(formatTokens)
  const endFmt = dayjs(endTimestamp).format(formatTokens)
  return `${key}_${startFmt}_to_${endFmt}`
}

export const getSkillsDataFilename = (prefix: string, dataFilenameExtension: string, fileDetails: SkillsCompletedLearnerRecordsFileDetails): string => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return `${prefix}_${fileDetails.date}_${fileDetails.sequenceNumber}.${dataFilenameExtension}`
}
