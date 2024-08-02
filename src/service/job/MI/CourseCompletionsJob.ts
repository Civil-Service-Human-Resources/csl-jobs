import * as govNotifyClient from '../../notification/govUKNotify/govUkNotify'
import * as tableService from '../../azure/storage/table/service'
import * as reportService from '../../reporting/reportService'
import { type JobResult } from '../jobService'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import { TableDateRangeJob } from './TableDateRangeJob'

export class CourseCompletionsJob extends TableDateRangeJob {
  constructor (protected readonly notificationClient: NotificationClient, protected readonly defaultFallbackDuration: string) {
    super(notificationClient, 'courseCompletions', defaultFallbackDuration)
  }

  protected async runJob (): Promise<JobResult> {
    log.info('Getting course completions')
    let resultText: string
    const dates = await this.getFromAndToDates()
    const zipReport = await reportService.generateCourseCompletionsReportZip(dates.fromDate, dates.toDate)
    if (zipReport !== undefined) {
      await Promise.all(
        [govNotifyClient.sendCourseCompletionsNotification(
          dates.fromDate,
          dates.toDate,
          zipReport.uploadResult),
        govNotifyClient.sendCourseCompletionsPasswordNotification(
          dates.fromDate,
          dates.toDate,
          zipReport.zip.password)]
      )
      resultText = `Successfully generated and sent course completions file '${zipReport.zip.result.filename}'`
    } else {
      resultText = 'Found 0 course completions for the specified time period'
    }
    await tableService.upsertJobData('courseCompletions', 'lastReportTimestamp', dates.toDate.toISOString())
    return {
      text: resultText
    }
  }

  public getName (): string {
    return 'Course completions report'
  }
}
