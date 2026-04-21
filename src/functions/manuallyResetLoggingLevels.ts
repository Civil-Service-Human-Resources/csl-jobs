import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { JobType } from '../service/job/JobType'
import { getNotificationClient } from '../service/notification/notifications'
import { AzureClientService } from '../service/azure/infrastructure/azureClientService'
import { ResetTestEnvLoggingLevelsJobArgs } from '../service/job/infrastructure/resetTestEnvLoggingLevelsJobArgs'
import { ResetTestEnvLoggingLevelsJob } from '../service/job/infrastructure/resetTestEnvLoggingLevelsJob'
import { plainToInstance } from 'class-transformer'
import log from 'log'
import config from '../config'
import { DefaultAzureCredential } from '@azure/identity'

export async function handler (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const notificationClient = getNotificationClient(JobType.RESET_LOGGING_LEVELS.valueOf())
  const azureCredential = new DefaultAzureCredential()
  const azureService = new AzureClientService(azureCredential, config.azure.subscriptionName)

  const body = await request.json() as ResetTestEnvLoggingLevelsJobArgs

  const params = plainToInstance(ResetTestEnvLoggingLevelsJobArgs, body)
  const errors = await params.validateObject()

  if (errors != null) {
    const formattedErrors = errors.map(err => {
      return ({
        field: err.property,
        errors: Object.values((err.constraints != null) || {})
      })
    })
    log.error('Validator errors: ' + formattedErrors.join(', '))
    return {
      status: 400,
      jsonBody: {
        error: 'Validation Error',
        details: formattedErrors
      }
    }
  }
  const job = new ResetTestEnvLoggingLevelsJob(notificationClient, {
    webResourceGroup: config.azure.webResourceGroup
  }, params, azureService)
  const result = await job.execute()
  return {
    status: 200,
    jsonBody: {
      result: result.text
    }
  }
}

app.http('manuallySetLoggingLevels', {
  methods: ['POST'],
  authLevel: 'function',
  handler
})
