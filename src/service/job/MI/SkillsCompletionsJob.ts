import * as tableService from '../../azure/storage/table/service'
import * as reportService from '../../reporting/reportService'
import { type JobResult } from '../jobService'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import { TableDateRangeJob } from './TableDateRangeJob'

export class SkillsCompletionsJob extends TableDateRangeJob {
  constructor (protected readonly notificationClient: NotificationClient, protected readonly defaultFallbackDuration: string) {
    super(notificationClient, 'skillsCompletions', defaultFallbackDuration)
  }

  protected async runJob (): Promise<JobResult> {
    log.info('Getting skills completions learner records')
    let resultText: string
    const dates = await this.getFromAndToDates()
    const emailIds = []
    const csvUploadResult = await reportService.generateSkillsCompletedLearnerRecordsAndUploadToSftp(emailIds, dates.fromDate, dates.toDate)
    if (csvUploadResult !== undefined) {
      resultText = `Successfully generated and uploaded the skills completion learner record csv file '${csvUploadResult.result.filename}'`
    } else {
      resultText = 'Found 0 course completions for the specified time period'
    }
    await tableService.upsertJobData('skillsCompletions', 'lastReportTimestamp', dates.toDate.toISOString())
    return {
      text: resultText
    }
  }

  public getName (): string {
    return 'Course completions report'
  }
}
