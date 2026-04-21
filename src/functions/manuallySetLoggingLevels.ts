import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { JobType } from '../service/job/JobType'
import { getNotificationClient } from '../service/notification/notifications'
import { AzureClientService } from '../service/azure/infrastructure/azureClientService'
import { SetTestEnvLoggingLevelsJobArgs } from '../service/job/infrastructure/setTestEnvLoggingLevelsJobArgs'
import { SetTestEnvLoggingLevelsJob } from '../service/job/infrastructure/setTestEnvLoggingLevelsJob'
import { plainToInstance } from 'class-transformer'
import log from 'log'
import config from '../config'
import { DefaultAzureCredential } from '@azure/identity'

export async function manuallySetLoggingLevels (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const notificationClient = getNotificationClient(JobType.SET_LOGGING_LEVELS.valueOf())
  const azureCredential = new DefaultAzureCredential()
  const azureService = new AzureClientService(azureCredential, config.azure.subscriptionName)

  const body = await request.json() as SetTestEnvLoggingLevelsJobArgs

  const params = plainToInstance(SetTestEnvLoggingLevelsJobArgs, body)
  const errors = await params.validateObject()

  if (errors != null && errors.length > 0) {
    const eList: string[] = []
    const formattedErrors = errors.map(err => {
      const errors = (err.constraints != null) ? Object.values(err.constraints) : []
      eList.push(`${err.property}: ${errors.join(', ')}`)
      return ({
        field: err.property,
        errors
      })
    })
    log.error('Validator errors: ' + eList.join(' | '))
    return {
      status: 400,
      jsonBody: {
        error: 'Validation Error',
        details: formattedErrors
      }
    }
  }
  const job = new SetTestEnvLoggingLevelsJob(notificationClient, {
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
  methods: ['GET', 'POST'],
  authLevel: 'admin',
  handler: manuallySetLoggingLevels
})
