import * as tableService from '../../azure/storage/table/service'
import * as reportService from '../../reporting/reportService'
import { type JobResult } from '../jobService'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import { TableDateRangeJob } from './TableDateRangeJob'

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
      resultText = `Successfully generated and uploaded the skills completion learner record csv file '${csvUploadResult.csvFile.filename}'`
    } else {
      resultText = 'Found 0 course completions for the specified time period'
    }
    await tableService.upsertJobData(this.tablePartitionKey, 'lastReportTimestamp', currentTimeStamp)
    return {
      text: resultText
    }
  }

  public getName (): string {
    return 'Skills completions extract'
  }
}
