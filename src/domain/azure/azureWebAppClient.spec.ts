import sinon from 'sinon'
import { AzureWebAppClient, CONFIG_OP } from './azureWebAppClient'
import { expect } from 'chai'

describe('Azure Web App Client tests', () => {
  const sandbox = sinon.createSandbox()
  const webSiteManagementClient = {
    webApps: {
      listByResourceGroup: sandbox.stub(),
      listApplicationSettings: sandbox.stub(),
      updateApplicationSettings: sandbox.stub()
    }
  }
  beforeEach(() => {
    sandbox.reset()
  })
  it('Should update the web app with new and existing settings', async () => {
    const existingSettings = {
      properties: {
        SETTING_1: 'VALUE_1',
        SETTING_2: 'VALUE_2',
        SETTING_3: 'VALUE_3'
      }
    }
    webSiteManagementClient.webApps.listApplicationSettings.withArgs('testResourceGroup', 'appName').resolves(existingSettings)
    const client = new AzureWebAppClient(webSiteManagementClient as any)
    const result = await client.updateApplicationSettings('testResourceGroup', 'appName', [
      {
        key: 'SETTING_1',
        value: 'UPDATED_1',
        operation: CONFIG_OP.UPSERT
      },
      {
        key: 'SETTING_2',
        value: 'UPDATED_2',
        operation: CONFIG_OP.UPDATE
      },
      {
        key: 'SETTING_4',
        value: 'UPDATED_4',
        operation: CONFIG_OP.UPDATE
      },
      {
        key: 'SETTING_5',
        value: 'UPDATED_5',
        operation: CONFIG_OP.UPSERT
      }
    ])
    expect(result).to.eql(true)
    sandbox.assert.calledWith(webSiteManagementClient.webApps.updateApplicationSettings, 'testResourceGroup', 'appName', {
      properties: {
        SETTING_1: 'UPDATED_1',
        SETTING_2: 'UPDATED_2',
        SETTING_3: 'VALUE_3',
        SETTING_5: 'UPDATED_5'
      }
    })
  })
  it('Should skip updating if there are no changes', async () => {
    const existingSettings = {
      properties: {
        SETTING_1: 'VALUE_1'
      }
    }
    webSiteManagementClient.webApps.listApplicationSettings.withArgs('testResourceGroup', 'appName').resolves(existingSettings)
    const client = new AzureWebAppClient(webSiteManagementClient as any)
    const result = await client.updateApplicationSettings('testResourceGroup', 'appName', [
      {
        key: 'SETTING_1',
        value: 'VALUE_1',
        operation: CONFIG_OP.UPSERT
      }
    ])
    expect(result).to.eql(false)
    sandbox.assert.notCalled(webSiteManagementClient.webApps.updateApplicationSettings)
  })
})
