import type { AppServicePlan, AppServicePlansCreateOrUpdateResponse, AppServicePlansGetResponse, Site, WebSiteManagementClient } from '@azure/arm-appservice'
import log from 'log'
import JobReport from '../jobReport'
import ScaleLevel from '../scaleLevel'
import config from '../../config'

export enum CONFIG_OP {
  UPDATE,
  UPSERT
}

export interface ConfigOperation {
  key: string
  operation: CONFIG_OP
  value: string
}

export interface UpdateResult {
  updated: number
  noChange: number
  error: number
}

export class AzureWebAppClient {
  constructor (private readonly webClient: WebSiteManagementClient) {

  }

  async updateAppSettingsInResourceGroup (resourceGroup: string, valuesToUpdate: ConfigOperation[]): Promise<UpdateResult> {
    const resCounts = {
      updated: 0,
      noChange: 0,
      error: 0
    }
    for (const app of await this.getWebAppsInResourceGroup(resourceGroup)) {
      const appName: string | undefined = app.name
      if (appName === undefined || app.resourceGroup === undefined) continue
      log.info(`Checking app ${appName}`)

      try {
        const appUpdates = await this.updateApplicationSettings(app.resourceGroup, appName, valuesToUpdate)
        if (appUpdates) {
          resCounts.updated++
        } else {
          resCounts.noChange++
        }
      } catch (err: any) {
        resCounts.error++
        log.error(`Failed to update ${appName}: ${err as string}`)
      }
    }
    return resCounts
  }

  async getWebAppsInResourceGroup (resourceGroup: string): Promise<Site[]> {
    const apps: Site[] = []
    for await (const site of this.webClient.webApps.listByResourceGroup(resourceGroup)) {
      apps.push(site)
    }
    return apps
  }

  async getWebAppServicePlansInResourceGroup (resourceGroup: string): Promise<AppServicePlan[]> {
    const appServicePlans: AppServicePlan[] = []
    for await (const plan of this.webClient.appServicePlans.listByResourceGroup(resourceGroup)) {
      appServicePlans.push(plan)
    }
    return appServicePlans
  }

  async updateApplicationSettings (resourceGroup: string, appName: string, valuesToUpdate: ConfigOperation[]): Promise<boolean> {
    const currentSettings = await this.webClient.webApps.listApplicationSettings(resourceGroup, appName)
    const settingsDict = currentSettings.properties === undefined ? {} : currentSettings.properties
    const updates: Record<string, string> = {}
    valuesToUpdate.forEach(v => {
      if (v.operation === CONFIG_OP.UPSERT) {
        if (settingsDict[v.key] === undefined || settingsDict[v.key] !== v.value) {
          updates[v.key] = v.value
        }
      } else {
        if (settingsDict[v.key] !== undefined && settingsDict[v.key] !== v.value) {
          updates[v.key] = v.value
        }
      }
    })
    if (Object.keys(updates).length > 0) {
      const newSettings = {
        ...settingsDict,
        ...updates
      }

      await this.webClient.webApps.updateApplicationSettings(resourceGroup, appName, {
        properties: newSettings
      })
      log.info(`Successfully updated: ${JSON.stringify(updates)}`)
      return true
    } else {
      log.info('No updates to apply')
      return false
    }
  }

  async updateInstanceCountForAllAppServicesInResourceGroup (resourceGroup: string, scaleLevel: ScaleLevel = ScaleLevel.DOWN): Promise<JobReport> {
    const report: JobReport = new JobReport()

    if (scaleLevel === ScaleLevel.DOWN) {
      const appServicePlanList: AppServicePlan[] = await this.getWebAppServicePlansInResourceGroup(resourceGroup)

      for (const appServicePlan of appServicePlanList) {
        try {
          if (appServicePlan.name !== undefined) {
            const result: AppServicePlansCreateOrUpdateResponse = await this.updateInstanceCountForAppService(resourceGroup, appServicePlan.name, 1)
            log.info(`App service plan ${appServicePlan.name} updated.`)
            log.debug(result)
          }
          report.addSuccessful()
        } catch (e: any) {
          const errorMsg = e as string
          report.addError(`Failed to update instance count for app service plan ${appServicePlan.name !== undefined ? appServicePlan.name : ''}: ${errorMsg}`)
        }
      }
      return report
    } else {
      const instanceCounts = [
        {
          appServicePlanName: `lpg-${resourceGroup}-notification-serviceserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.notificationService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-lpg-report-serviceserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.reportService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-lpg-uiserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.uiService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-rustici-engine`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.rusticiEngine
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-lpg-learner-recordserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.learnerRecordService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-identity-managementserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.identityManagementService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-csl-service`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.cslService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-identityserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.identityService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-lpg-learning-catalogueserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.learningCatalogueService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-civil-servant-registryserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.civilServantRegistryService
        },
        {
          appServicePlanName: `lpg-${resourceGroup}-lpg-managementserviceplan`,
          instanceCount: config.jobs.scaleDownAppServices.scaleUpInstances.managementService
        }
      ]

      for (const servicePlanInstance of instanceCounts) {
        const { appServicePlanName, instanceCount } = servicePlanInstance
        try {
          const result: AppServicePlansCreateOrUpdateResponse = await this.updateInstanceCountForAppService(resourceGroup, appServicePlanName, Number(instanceCount))
          log.info(`App service plan ${appServicePlanName} updated.`)
          log.debug(result)
          report.addSuccessful()
        } catch (e: any) {
          const errorMsg = e as string
          report.addError(`Failed to update instance count for app service plan ${appServicePlanName}: ${errorMsg}`)
        }
      }
      return report
    }
  }

  async updateInstanceCountForAppService (resourceGroup: string, appName: string, instanceCount: number): Promise<AppServicePlan> {
    const client: WebSiteManagementClient = this.webClient
    const appServicePlan: AppServicePlansGetResponse = await client.appServicePlans.get(resourceGroup, appName)

    if (appServicePlan.sku != null) {
      appServicePlan.sku.capacity = instanceCount

      const result: AppServicePlansCreateOrUpdateResponse = await client.appServicePlans.beginCreateOrUpdateAndWait(
        resourceGroup,
        appName,
        appServicePlan
      )
      return result
    }

    throw new Error('SKU not found')
  }
}
