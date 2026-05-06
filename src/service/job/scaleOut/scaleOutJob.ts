import { Job } from '../Job'
import { type JobResult } from '../jobService'

import config from '../../../config'
import { type AzureClientService } from '../../azure/infrastructure/azureClientService'
import { type NotificationClient } from '../../notification/notifications'
import { type AzureWebAppClient } from '../../../domain/azure/azureWebAppClient'
import log from 'log'
import type JobReport from '../../../domain/jobReport'
import ScaleLevel from '../../../domain/scaleLevel'

const { azure: { webResourceGroup } } = config

export class ScaleOutJob extends Job {
  constructor (notificationClient: NotificationClient, private readonly azureClientService: AzureClientService) {
    super(notificationClient)
  }

  protected async runJob (): Promise<JobResult> {
    log.info('Starting app service scale out job')
    const azureWebAppClient: AzureWebAppClient = await this.azureClientService.getWebsiteManagementClient()

    const jobReport: JobReport = await azureWebAppClient.updateInstanceCountForAllAppServicesInResourceGroup(webResourceGroup, ScaleLevel.DOWN)

    if (jobReport.errors.length > 0) {
      log.debug(`Errors were encountered during the scale out process: ${jobReport.errors.join(', ')}`)
    }

    return {
      text: `App service scale out job ended. ${jobReport.getReport()}`
    }
  }

  public getName (): string {
    return 'App Services scale out job'
  }
}
