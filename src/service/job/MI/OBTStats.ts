import { type JobResult } from '../jobService'
import log from 'log'
import { type NotificationClient } from '../../notification/notifications'
import * as reportService from '../../reporting/reportService'
import * as awsConnection from '../../aws/s3/connection'
import { Job } from '../Job'

export class OBTStatsJob extends Job {
  constructor (protected readonly notificationClient: NotificationClient,
    private readonly bucketAlias: string,
    private readonly keySubFolder: string,
    private readonly courseIds: string[]) {
    super(notificationClient)
  }

  protected async runJob (): Promise<JobResult> {
    let resp = 'AWS bucket credentials not set'
    if (awsConnection.canSend && this.bucketAlias.length > 0) {
      log.info('Getting course completions')
      resp = await reportService.generateOBTStatsAndUploadToS3(this.courseIds, this.keySubFolder, this.bucketAlias)
    }
    return {
      text: resp
    }
  }

  public getName (): string {
    return 'OBT stats'
  }
}
