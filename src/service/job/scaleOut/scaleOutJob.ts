import { Job } from "../Job"
import { JobResult } from "../jobService"

import config from "../../../config"
import { AzureClientService } from "../../azure/infrastructure/azureClientService"
import { NotificationClient } from "../../notification/notifications"
import { AzureWebAppClient } from "../../../domain/azure/azureWebAppClient"
import log from "log"
import JobReport from "../../../domain/jobReport"
import ScaleLevel from "../../../domain/scaleLevel"

const {azure: {webResourceGroup}} = config

export class ScaleOutJob extends Job{
  constructor(notificationClient: NotificationClient, private azureClientService: AzureClientService){
      super(notificationClient)
  }

  protected async runJob(): Promise<JobResult> {
    log.info("Starting app service scale out job")
    const azureWebAppClient: AzureWebAppClient = await this.azureClientService.getWebsiteManagementClient()

    const jobReport: JobReport = await azureWebAppClient.updateInstanceCountForAllAppServicesInResourceGroup(webResourceGroup, ScaleLevel.DOWN)

    if(jobReport.errors.length > 0){
      log.debug(`Errors were encountered during the scale out process: ${jobReport.errors.join(", ")}`)
    }

    return {
      text: `App service scale out job ended. ${jobReport.getReport()}`
    }
  }

  public getName(): string {
    return "App Services scale out job"
  } 
}