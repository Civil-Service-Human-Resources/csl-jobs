import * as tableService from '../../azure/storage/table/service'
import * as reportService from '../../reporting/reportService'
import { type JobResult } from '../jobService'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import { TableDateRangeJob } from './TableDateRangeJob'
import config from '../../../config'

export class SkillsCompletionsJob extends TableDateRangeJob {
  constructor (protected readonly notificationClient: NotificationClient, protected readonly defaultFallbackDuration: string) {
    super(notificationClient, 'skillsSync', defaultFallbackDuration)
  }

  protected async runJob (): Promise<JobResult> {
    log.info('Getting skills completions learner records')
    const currentTimeStamp = new Date().toISOString()
    log.info(`Data extract timeStamp: '${currentTimeStamp}'`)
    const lastSuccessTimestamp = await tableService.getDateFromTable(this.tablePartitionKey, 'lastReportTimestamp')
    const csvUploadResult = await reportService.generateSkillsCompletedLearnerRecordsAndUploadToSftp(lastSuccessTimestamp)
    let resultText: string
    if (csvUploadResult !== undefined) {
      if (csvUploadResult.csvFile.contents.length <= 0 && !config.jobs.skillsCompletedLearnerRecords.sendBlankCsvFile) {
        log.info('Blank skills completion learner record csv file is not allowed to send therefore it is not generated')
        resultText = 'Blank skills completion learner record csv file is not allowed to send therefore it is not generated'
      } else {
        log.info(`Successfully generated and uploaded the skills completion learner record csv file '${csvUploadResult.csvFile.filename}'`)
        resultText = `Successfully generated and uploaded the skills completion learner record csv file '${csvUploadResult.csvFile.filename}'`
      }
      await tableService.upsertJobData(this.tablePartitionKey, 'lastReportTimestamp', currentTimeStamp)
      log.info(`lastReportTimestamp is updated in the skillsSync Azure partition: '${currentTimeStamp}'`)
    } else {
      log.error('Execution failed for the skills completion learner record csv file')
      resultText = 'Execution failed for the skills completion learner record csv file'
    }
    return {
      text: resultText
    }
  }

  public getName (): string {
    return 'Skills completions extract'
  }
}
