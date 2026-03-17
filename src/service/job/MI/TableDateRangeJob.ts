import { type DateRange, type DateRangeJob, type PartialDateRange } from './DateRangeJob'
import * as dateService from '../../date/service'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import { TableJob } from '../Job'
import { type JobTableService } from '../../azure/storage/table/jobTableService'

export abstract class TableDateRangeJob extends TableJob implements DateRangeJob {
  constructor (notificationClient: NotificationClient,
    tableService: JobTableService, protected readonly defaultFallbackDuration: string) {
    super(notificationClient, tableService)
  }

  getFromAndToDatesWithFallback = async (): Promise<DateRange> => {
    const dateRange = await this.getFromAndToDates()
    let lastSuccessTimestamp = dateRange.fromDate
    if (lastSuccessTimestamp === undefined) {
      log.info(`Last run timestamp does not exist - calculating from fallback duration '${this.defaultFallbackDuration}'`)
      lastSuccessTimestamp = dateService.getNewDateFromDateWithDuration(dateRange.toDate, this.defaultFallbackDuration, 'subtract')
    }
    return {
      fromDate: lastSuccessTimestamp,
      toDate: dateRange.toDate
    }
  }

  getFromAndToDates = async (): Promise<PartialDateRange> => {
    const toTimestamp = dateService.getMidnightToday()
    log.info('Getting last run timestamp from table service')
    const lastSuccessTimestamp = await this.tableService.getDateFromTable('lastReportTimestamp')
    return {
      fromDate: lastSuccessTimestamp,
      toDate: toTimestamp
    }
  }
}
