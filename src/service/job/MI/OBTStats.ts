import { type JobResult } from '../jobService'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import * as reportService from '../../reporting/reportService'
import { TableDateRangeJob } from './TableDateRangeJob'
import * as awsConnection from '../../aws/s3/connection'
import { type TableService } from '../../azure/storage/table/service'

export class OBTStatsJob extends TableDateRangeJob {
  constructor (protected readonly notificationClient: NotificationClient,
    protected readonly defaultFallbackDuration: string,
    private readonly bucketAlias: string,
    private readonly keySubFolder: string,
    private readonly courseIds: string[],
    tableService: TableService) {
    super(notificationClient, tableService, defaultFallbackDuration)
  }

  protected async runJob (): Promise<JobResult> {
    let resp = 'AWS bucket credentials not set'
    if (awsConnection.canSend && this.bucketAlias.length > 0) {
      log.info('Getting course completions')
      const dates = await this.getFromAndToDatesWithFallback()
      resp = await reportService.generateOBTStatsAndUploadToS3(dates.fromDate, dates.toDate, this.courseIds,
        this.keySubFolder, this.bucketAlias)
      await this.tableService.upsertValueInTable('lastReportTimestamp', dates.toDate.toISOString())
    }
    return {
      text: resp
    }
  }

  public getName (): string {
    return 'OBT stats'
  }
}
