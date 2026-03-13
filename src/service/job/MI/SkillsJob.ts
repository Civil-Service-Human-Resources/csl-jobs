import { TableDateRangeJob } from './TableDateRangeJob'
import { type JobResult } from '../jobService'
import { type NotificationClient } from '../../notification/notifications'
import { uploadFile } from '../../reporting/reportService'
import { JobsFile } from '../../file/models'
import { type FtpService } from '../../ftp/ftpService'
import log from 'log'
import { zipFiles } from '../../file/zip'
import * as govNotifyClient from '../../notification/govUKNotify/govUkNotify'
import {
  getDeltaSkillsCompletedLearnerRecords,
  getNewSkillsCompletedLearnerRecords
} from '../../../db/shared/database'
import { objsToDelimited } from '../../file/delimited'
import { type TableService } from '../../azure/storage/table/service'
import { type CustomDate } from '../../date/CustomDate'

export interface SkillsJobConfig {
  file: {
    filenamePrefixCreate: string
    filenamePrefixUpdate: string
    extension: string
    fileDelimiter: string
    remoteDir: string
  }
  defaultFallbackDuration: string
  sendBlankFile: boolean
  emailRecipients: string[]
  emptyFileNotificationRecipients: string[]
}

interface SkillsCompletedLearnerRecordsFileDetails {
  operation: string
  date: string
  sequenceNumber: number
}

export interface EmailsToProcess {
  newEmails: string[]
  existingEmails: string[]
}

export abstract class SkillsJob extends TableDateRangeJob {
  constructor (notificationClient: NotificationClient, tableService: TableService, private readonly config: SkillsJobConfig,
    protected readonly ftpService?: FtpService) {
    super(notificationClient, tableService, config.defaultFallbackDuration)
  }

  protected async getSkillsFile (currentDate: CustomDate): Promise<SkillsCompletedLearnerRecordsFileDetails> {
    const currentDateString = currentDate.format('DDMMYYYY')
    let date = await this.tableService.getValueFromTable('lastFileDate')
    let sequenceNumber = await this.tableService.getNumberFromTable('lastFileSequenceNumber') ?? 0
    if (date !== undefined && sequenceNumber > 0) {
      if (date === currentDateString) {
        sequenceNumber += 1
      }
    } else {
      sequenceNumber = 1
    }
    date = currentDateString
    const operation = await this.tableService.getValueFromTable('lastFileOperation') ?? ''
    return {
      operation,
      date,
      sequenceNumber
    }
  }

  protected async saveSkillsFile (file: SkillsCompletedLearnerRecordsFileDetails): Promise<void> {
    await this.tableService.upsertValueInTable('lastFileOperation', file.operation)
    await this.tableService.upsertValueInTable('lastFileDate', file.date)
    await this.tableService.upsertValueInTable('lastFileSequenceNumber', file.sequenceNumber.toString())
  }

  protected async getEmails (): Promise<EmailsToProcess> {
    const newEmails = await this.tableService.getListFromTable('newEmailIds') ?? []
    const existingEmails = await this.tableService.getListFromTable('emailIds') ?? []
    return {
      newEmails,
      existingEmails
    }
  }

  protected getDataFileName (prefix: string, fileDetails: SkillsCompletedLearnerRecordsFileDetails): string {
    return `${prefix}_${fileDetails.date}_${fileDetails.sequenceNumber}.${this.config.file.extension}`
  }

  protected async sendEmails (dataFile: JobsFile): Promise<boolean> {
    if (this.config.emailRecipients.length > 0) {
      const zipFile = await zipFiles([dataFile], dataFile.filename)
      const uploadResult = await uploadFile(zipFile.result)
      log.info(`Skills zip file '${zipFile.result.filename}' is created and uploaded to Azure blob storage`)
      const description = `Skills learner record extract: ${dataFile.filename}`
      const emailsSent = (await Promise.all([govNotifyClient.sendSkillsFileNotification(uploadResult, description, this.config.emailRecipients),
        govNotifyClient.sendSkillsFilePasswordNotification(zipFile.password, description, this.config.emailRecipients)])).reduce((a, b) => a + b, 0)
      return emailsSent > 0
    } else {
      return false
    }
  }

  protected async processFile (fileContents: string, prefix: string, file: SkillsCompletedLearnerRecordsFileDetails): Promise<boolean> {
    const dataFileName = this.getDataFileName(prefix, file)
    log.info(`Processing file ${dataFileName}`)
    const dataFile = JobsFile.from(`${dataFileName}`, fileContents)
    await uploadFile(dataFile)
    let uploadResultText: string
    let uploadResult: boolean | undefined
    if (this.ftpService !== undefined) {
      uploadResult = await this.ftpService.uploadFileFromDatafile(dataFile, this.config.file.remoteDir)
      uploadResultText = uploadResult
        ? `Skills completion learner record data file '${dataFile.filename}' successfully uploaded to file server.`
        : `Skills completion learner record data file '${dataFile.filename}' upload FAILED.`
    } else {
      uploadResultText = `Skills completion learner record data file '${dataFile.filename}' was not uploaded because no file server was defined.`
      uploadResult = true
    }
    const sentEmails = await this.sendEmails(dataFile)
    const emailResultText = sentEmails
      ? ' Zip file successfully sent via email.'
      : ' Data zip file not sent via email because no email recipients are defined.'
    await this.notificationClient.infoNotification(uploadResultText + emailResultText)
    if (uploadResult || sentEmails) {
      await this.saveSkillsFile(file)
      return true
    }
    return false
  }

  protected async runJob (): Promise<JobResult> {
    let totalRecordCount = 0
    const dates = await this.getFromAndToDatesWithFallback()
    const resultText: string[] = []
    const emails = await this.getEmails()
    log.info(`Found ${emails.newEmails.length} new emails and ${emails.existingEmails.length} existing emails`)
    if (emails.newEmails.length > 0) {
      log.info('Processing new emails')
      const file = await this.getSkillsFile(dates.toDate)
      log.info(`Fetched previous run details: ${file.date} ${file.operation} ${file.sequenceNumber}`)
      const records = await getNewSkillsCompletedLearnerRecords(emails.newEmails)
      log.info(`Fetched ${records.length} records`)
      totalRecordCount += records.length
      if (records.length === 0 && !this.config.sendBlankFile) {
        await this.notificationClient.infoNotification('Data not found. Blank skills completion learner record data file is not allowed to send, therefore it is not generated.')
      } else {
        file.operation = 'create'
        const fileContents = await objsToDelimited(records, this.config.file.fileDelimiter)
        const result = await this.processFile(fileContents, this.config.file.filenamePrefixCreate, file)
        if (result) {
          log.info(`New user data extract completed successfully. Adding ${emails.newEmails.length} new users to ${emails.existingEmails.length} existing users`)
          const allEmails = [...new Set([...emails.existingEmails, ...emails.newEmails])]
          await this.tableService.deleteValueInTable('newEmailIds')
          await this.tableService.upsertValueInTable('emailIds', allEmails.join(','))
          resultText.push(`Processed ${emails.newEmails.length} new emails`)
        } else {
          resultText.push(`Did not process ${emails.newEmails.length} new emails`)
        }
      }
    } else {
      await this.notificationClient.infoNotification('No new emails to process, processing delta emails')
    }

    if (emails.existingEmails.length > 0) {
      const file = await this.getSkillsFile(dates.toDate)
      const records = await getDeltaSkillsCompletedLearnerRecords(emails.existingEmails, dates.fromDate)
      totalRecordCount += records.length
      if (records.length === 0 && !this.config.sendBlankFile) {
        await this.notificationClient.infoNotification('Data not found. Blank skills completion learner record data file is not allowed to send, therefore it is not generated.')
      } else {
        file.operation = 'update'
        const fileContents = await objsToDelimited(records, this.config.file.fileDelimiter)
        const result = await this.processFile(fileContents, this.config.file.filenamePrefixUpdate, file)
        if (result) {
          await this.tableService.upsertValueInTable('lastReportTimestamp', dates.toDate.toISOString())
          resultText.push(`Processed ${emails.existingEmails.length} existing emails`)
        } else {
          resultText.push(`Did not process ${emails.existingEmails.length} existing emails`)
        }
      }
    } else {
      await this.notificationClient.infoNotification('No existing emails to process')
    }
    if (totalRecordCount === 0 && this.config.emptyFileNotificationRecipients.length > 0) {
      await govNotifyClient.sendSkillsBlankFileNotification(this.config.emptyFileNotificationRecipients)
      resultText.push(`Alerted ${this.config.emptyFileNotificationRecipients.length} emails about an empty file`)
    }
    return {
      text: resultText.join(', ')
    }
  }
}
