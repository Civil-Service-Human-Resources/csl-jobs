import * as govNotifyClient from '../../notification/govUKNotify/govUkNotify'
import * as tableService from '../../azure/storage/table/service'
import * as reportService from '../../reporting/reportService'
import * as dateService from '../../date/service'
import { type JobResult } from '../jobService'
import { Job } from '../Job'
import log from 'log'
import { type CustomDate } from '../../date/CustomDate'
import { type NotificationClient } from '../../notification/notifications'

interface DateRange {
  fromDate: CustomDate
  toDate: CustomDate
}

export class CourseCompletionsJob extends Job {
  constructor (protected readonly notificationClient: NotificationClient, private readonly defaultFallbackDuration: string) {
    super(notificationClient)
    this.defaultFallbackDuration = defaultFallbackDuration
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

  getFromAndToDates = async (): Promise<DateRange> => {
    const toTimestamp = dateService.getMidnightToday()
    log.info('Getting last run timestamp from table service')
    let lastSuccessTimestamp = await tableService.getDateFromTable('courseCompletions', 'lastReportTimestamp')
    if (lastSuccessTimestamp === undefined) {
      log.info(`Last run timestamp does not exist - calculating from fallback duration '${this.defaultFallbackDuration}'`)
      lastSuccessTimestamp = dateService.getNewDateFromDateWithDuration(toTimestamp, this.defaultFallbackDuration, 'subtract')
    }
    return {
      fromDate: lastSuccessTimestamp,
      toDate: toTimestamp
    }
  }

  public getName (): string {
    return 'Course completions report'
  }
}
