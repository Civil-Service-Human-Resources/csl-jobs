import * as tableService from '../../azure/storage/table/service'
import { type JobResult } from '../jobService'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import { getAnonymousCourseRecords } from '../../../db/shared/database'
import { objsToCsv } from '../../file/csv'
import { JobsFile } from '../../file/models'
import { getTimeRangeFileName } from '../../reporting/reportService'
import { uploadFile } from '../../aws/s3/service'
import { TableDateRangeJob } from './TableDateRangeJob'
import { canSend } from '../../aws/s3/connection'
import { getOrganisationsWithFullNames } from '../../csrs/service'

export class OBTStatsJob extends TableDateRangeJob {
  constructor (protected readonly notificationClient: NotificationClient,
    protected readonly defaultFallbackDuration: string,
    private readonly bucketAlias: string,
    private readonly keySubFolder: string,
    private readonly courseIds: string[]) {
    super(notificationClient, 'obtStats', defaultFallbackDuration)
  }

  protected async runJob (): Promise<JobResult> {
    let resp = 'AWS bucket credentials not set'
    if (canSend && this.bucketAlias.length > 0) {
      log.info('Getting course completions')
      const dates = await this.getFromAndToDates()
      const data = await getAnonymousCourseRecords(dates.fromDate, dates.toDate, this.courseIds)
      const orgsNameMap = await getOrganisationsWithFullNames()
      for (const row of data) {
        const fullOrgName = orgsNameMap.get(parseInt(row.organisationId))
        if (fullOrgName !== undefined) {
          row.organisation = fullOrgName
        }
      }
      resp = 'No OBT data to send'
      if (data.length > 0) {
        const csv = await objsToCsv(data)
        const fileName = getTimeRangeFileName('obt_stats', dates.fromDate, dates.toDate)
        const csvFile = JobsFile.from(`${this.keySubFolder}/${fileName}.csv`, csv)
        await uploadFile(this.bucketAlias, csvFile)
        await tableService.upsertJobData('obtStats', 'lastReportTimestamp', dates.toDate.toISOString())
        resp = `Successfully generated and upload OBT file '${fileName}' to S3`
      }
    }
    return {
      text: resp
    }
  }

  public getName (): string {
    return 'OBT stats'
  }
}
