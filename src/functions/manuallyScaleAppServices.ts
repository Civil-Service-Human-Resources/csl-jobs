import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { type AzureWebAppClient } from '../domain/azure/azureWebAppClient'
import config from '../config'
import type JobReport from '../domain/jobReport'
import { type ManuallyScaleAppServicesArgs } from '../domain/manuallyScaleAppServicesArgs'
import ScaleLevel from '../domain/scaleLevel'
import { DefaultAzureCredential } from '@azure/identity'
import { AzureClientService } from '../service/azure/infrastructure/azureClientService'
import { type AppServicePlan, type Site } from '@azure/arm-appservice'
import log from 'log'

export async function manuallyScaleAppServices (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const azureCredential = new DefaultAzureCredential()
    const azureWebAppClient: AzureWebAppClient = await new AzureClientService(azureCredential, config.azure.subscriptionName).getWebsiteManagementClient()
    const productionAzureWebAppClient: AzureWebAppClient = await new AzureClientService(azureCredential, config.azure.production.subscriptionName).getWebsiteManagementClient()
    const body: ManuallyScaleAppServicesArgs = await request.json() as ManuallyScaleAppServicesArgs

    let appServicePlanInstances: Array<{ appServicePlanName: string, instanceCount: number }> = []

    if (ScaleLevel[body.scaleLevel] === ScaleLevel.DOWN) {
      const appServicePlanList = await azureWebAppClient.getWebAppServicePlansInResourceGroup(config.azure.webResourceGroup)
      appServicePlanInstances = appServicePlanList.filter(plan => plan.name).map(plan => ({
        appServicePlanName: plan.name as string,
        instanceCount: 1
      }))
    } else {
      const productionAppServices: Site[] = await productionAzureWebAppClient.getWebAppsInResourceGroup(config.azure.production.webResourceGroup)

      for (const appService of productionAppServices) {
        const appName = appService.name
        if (appName === undefined) {
          log.error('App service does not have a name. Skipping scaling for this app service.')
          continue
        }

        log.info(`Getting instance count for production app service ${appName} for scaling`)
        const planName: string | undefined = appService.serverFarmId?.split('/').slice(-1)[0]
        if (planName === undefined) {
          log.error(`Failed to determine app service plan for production app service ${appName}. Skipping scaling for this app service.`)
          continue
        }
        const plan: AppServicePlan = await productionAzureWebAppClient.getWebAppServicePlan(config.azure.webResourceGroup, planName)
        if (plan.sku === undefined || plan.sku.capacity === undefined) {
          log.error(`Failed to determine instance count for app service plan ${planName}. Skipping scaling for app service ${appName}.`)
          continue
        }
        const productionInstanceCount: number = plan.sku.capacity

        const targetAppServiceName: string = appName.replace(config.azure.production.webResourceGroup, config.azure.webResourceGroup)
        const targetApp: Site | undefined = await azureWebAppClient.getWebApp(config.azure.webResourceGroup, targetAppServiceName)
        if (targetApp === undefined) {
          log.error(`Failed to find corresponding app service for production app service ${appName} in non-production environment. Skipping scaling for this app service.`)
          continue
        }
        const targetPlanName: string | undefined = targetApp.serverFarmId?.split('/').slice(-1)[0]
        if (targetPlanName === undefined) {
          log.error(`Failed to determine app service plan for app service ${targetAppServiceName} in non-production environment. Skipping scaling for this app service.`)
          continue
        }
        appServicePlanInstances.push({
          appServicePlanName: targetPlanName,
          instanceCount: productionInstanceCount
        })
      }
    }

    const report: JobReport = await azureWebAppClient.updateInstanceCountsForAppServicesInResourceGroup(config.azure.webResourceGroup, appServicePlanInstances)
    return {
      status: 200,
      jsonBody: {
        details: report.getReport(),
        error: report.errors.length > 0 ? report.errors : undefined
      }
    }
  } catch (e: any) {
    const errorMsg = e as string
    log.error(`Exception occurred while manually scaling app services: ${errorMsg}`)
    log.error(e)
    return {
      status: 500,
      jsonBody: {
        error: errorMsg
      }
    }
  }
}

app.http('manuallyScaleAppServices', {
  methods: ['GET', 'POST'],
  authLevel: 'admin',
  handler: manuallyScaleAppServices
})
