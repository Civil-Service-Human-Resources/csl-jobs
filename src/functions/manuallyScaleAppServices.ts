import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { type AzureWebAppClient } from '../domain/azure/azureWebAppClient'
import config from '../config'
import type JobReport from '../domain/jobReport'
import { type ManuallyScaleAppServicesArgs } from '../domain/manuallyScaleAppServicesArgs'
import ScaleLevel from '../domain/scaleLevel'
import log from 'log'

export async function manuallyScaleAppServices (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  log.info('Received request to manually scale app services')
  const azureWebAppClient: AzureWebAppClient = await this.azureClientService.getWebsiteManagementClient()
  log.debug('Retrieved Azure Web App client')
  const body: ManuallyScaleAppServicesArgs = await request.json() as ManuallyScaleAppServicesArgs
  log.info('Scaling app services to level: ' + body.scaleLevel)
  const report: JobReport = await azureWebAppClient.updateInstanceCountForAllAppServicesInResourceGroup(config.azure.webResourceGroup, ScaleLevel[body.scaleLevel])
  log.info('Job completed')
  log.info(report)
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
