import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AzureWebAppClient } from "../domain/azure/azureWebAppClient";
import ScaleLevel from "../domain/scaleLevel";
import config from "../config";
import JobReport from "../domain/jobReport";
import { ManuallyScaleAppServicesArgs } from "../domain/manuallyScaleAppServicesArgs";

export async function manuallyScaleAppServices(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>{

  const azureWebAppClient: AzureWebAppClient = await this.azureClientService.getWebsiteManagementClient()
  const body: ManuallyScaleAppServicesArgs = await request.json() as ManuallyScaleAppServicesArgs
  const report: JobReport = await azureWebAppClient.updateInstanceCountForAllAppServicesInResourceGroup(config.azure.webResourceGroup, body.scaleLevel)
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