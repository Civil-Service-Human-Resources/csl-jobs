import { type DateRange, DateRangeJob } from './DateRangeJob'
import * as dateService from '../../date/service'
import log from 'log'
import * as tableService from '../../azure/storage/table/service'
import { type NotificationClient } from '../../notification/notifications'

export abstract class TableDateRangeJob extends DateRangeJob {
  constructor (notificationClient: NotificationClient,
    protected tablePartitionKey: string, protected readonly defaultFallbackDuration: string) {
    super(notificationClient)
  }

  getFromAndToDates = async (): Promise<DateRange> => {
    const toTimestamp = dateService.getMidnightToday()
    log.info('Getting last run timestamp from table service')
    let lastSuccessTimestamp = await tableService.getDateFromTable(this.tablePartitionKey, 'lastReportTimestamp')
    if (lastSuccessTimestamp === undefined) {
      log.info(`Last run timestamp does not exist - calculating from fallback duration '${this.defaultFallbackDuration}'`)
      lastSuccessTimestamp = dateService.getNewDateFromDateWithDuration(toTimestamp, this.defaultFallbackDuration, 'subtract')
    }
    return {
      fromDate: lastSuccessTimestamp,
      toDate: toTimestamp
    }
  }
}
