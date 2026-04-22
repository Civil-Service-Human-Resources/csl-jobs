import { type Site, type WebSiteManagementClient } from '@azure/arm-appservice'
import log from 'log'

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
}
