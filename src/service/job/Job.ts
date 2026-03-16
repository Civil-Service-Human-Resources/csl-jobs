import log from 'log'
import { type NotificationClient } from '../notification/notifications'
import { type JobResult } from './jobService'
import { type JobTableService } from '../azure/storage/table/jobTableService'

export abstract class Job {
  constructor (protected readonly notificationClient: NotificationClient) {}

  public execute = async (): Promise<JobResult> => {
    const jobName = this.getName()
    try {
      await this.notificationClient.infoNotification(`Starting job '${jobName}'`)
      const res = await this.runJob()
      await this.notificationClient.infoNotification(`Job '${jobName}' ran successfully with result message '${res.text}'`)
      return res
    } catch (e) {
      const errorMsg = e as string
      log.error(`Exception running job ${jobName}: ${errorMsg}.`)
      log.error(e)
      await this.notificationClient.errorNotification(`Job '${jobName}' FAILED.`)
      throw e
    }
  }

  protected abstract runJob (): Promise<JobResult>
  public abstract getName (): string
}

export abstract class TableJob extends Job {
  constructor (notificationClient: NotificationClient, protected tableService: JobTableService) {
    super(notificationClient)
  }
}
