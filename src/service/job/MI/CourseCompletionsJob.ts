import * as govNotifyClient from '../../notification/govUKNotify/govUkNotify'
import * as reportService from '../../reporting/reportService'
import { type JobResult } from '../jobService'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import { TableDateRangeJob } from './TableDateRangeJob'
import { type TableService } from '../../azure/storage/table/service'

export class CourseCompletionsJob extends TableDateRangeJob {
  constructor (protected readonly notificationClient: NotificationClient, protected readonly defaultFallbackDuration: string,
    tableService: TableService) {
    super(notificationClient, tableService, defaultFallbackDuration)
  }

  protected async runJob (): Promise<JobResult> {
    log.info('Getting course completions')
    let resultText: string
    const dates = await this.getFromAndToDatesWithFallback()
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
    await this.tableService.upsertValueInTable('lastReportTimestamp', dates.toDate.toISOString())
    return {
      text: resultText
    }
  }

  public getName (): string {
    return 'Course completions report'
  }
}
