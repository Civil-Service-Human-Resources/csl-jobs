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
    const resultText = await reportService.generateSkillsCompletedLearnerRecordsAndUploadToSftp(this.tablePartitionKey)
    log.info(`SkillsCompletionsJob: runJob: resultText: '${resultText}'`)
    return {
      text: resultText
    }
  }

  public getName (): string {
    return 'Skills completions extract'
  }
}
