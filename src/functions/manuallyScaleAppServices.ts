import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { type AzureWebAppClient } from '../domain/azure/azureWebAppClient'
import config from '../config'
import type JobReport from '../domain/jobReport'
import { type ManuallyScaleAppServicesArgs } from '../domain/manuallyScaleAppServicesArgs'
import ScaleLevel from '../domain/scaleLevel'

export async function manuallyScaleAppServices (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const azureWebAppClient: AzureWebAppClient = await this.azureClientService.getWebsiteManagementClient()
  const body: ManuallyScaleAppServicesArgs = await request.json() as ManuallyScaleAppServicesArgs
  const report: JobReport = await azureWebAppClient.updateInstanceCountForAllAppServicesInResourceGroup(config.azure.webResourceGroup, ScaleLevel[body.scaleLevel])
  return {
    status: 200,
    jsonBody: {
      details: report.getReport(),
      error: report.errors.length > 0 ? report.errors : undefined
    }
  }
}

app.http('manuallyScaleAppServices', {
  methods: ['GET', 'POST'],
  authLevel: 'admin',
  handler: manuallyScaleAppServices
})
