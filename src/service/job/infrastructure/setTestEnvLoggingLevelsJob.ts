import { Job } from '../Job'
import { type JobResult } from '../jobService'
import { type NotificationClient } from '../../notification/notifications'
import { type SetTestEnvLoggingLevelsJobArgs } from './setTestEnvLoggingLevelsJobArgs'
import { type AzureClientService } from '../../azure/infrastructure/azureClientService'
import { type SetTestEnvLoggingLevelsJobConfig } from './SetTestEnvLoggingLevelsJobConfig'
import { CONFIG_OP, type ConfigOperation } from '../../../domain/azure/azureWebAppClient'

export class SetTestEnvLoggingLevelsJob extends Job {
  constructor (notificationClient: NotificationClient,
    private readonly config: SetTestEnvLoggingLevelsJobConfig,
    private _args: SetTestEnvLoggingLevelsJobArgs,
    private readonly azureClientService: AzureClientService) {
    super(notificationClient)
  }

  get args (): SetTestEnvLoggingLevelsJobArgs {
    return this._args
  }

  set args (value: SetTestEnvLoggingLevelsJobArgs) {
    this._args = value
  }

  getName (): string {
    return 'Set test environment logging levels'
  }

  APP_INSIGHTS_LOG_LEVEL_KEY = 'APPLICATIONINSIGHTS_INSTRUMENTATION_LOGGING_LEVEL'
  LOG_LEVEL_KEY = 'LOGGING_LEVEL'
  ROOT_LOG_LEVEL_KEY = 'ROOT_LOGGING_LEVEL'

  public async runJob (): Promise<JobResult> {
    const webClient = await this.azureClientService.getWebsiteManagementClient()
    const updates: ConfigOperation[] = [
      {
        key: this.APP_INSIGHTS_LOG_LEVEL_KEY,
        value: this._args.loggingLevel,
        operation: CONFIG_OP.UPSERT
      },
      {
        key: this.LOG_LEVEL_KEY,
        value: this._args.loggingLevel,
        operation: CONFIG_OP.UPDATE
      },
      {
        key: this.ROOT_LOG_LEVEL_KEY,
        value: this._args.loggingLevel,
        operation: CONFIG_OP.UPDATE
      }
    ]
    const resCounts = await webClient.updateAppSettingsInResourceGroup(this.config.webResourceGroup, updates)
    return {
      text: `Result for web apps in ${this.config.webResourceGroup}: Updated ${resCounts.updated}, did not update ${resCounts.noChange}. ${resCounts.error} errors.`
    }
  }
}
