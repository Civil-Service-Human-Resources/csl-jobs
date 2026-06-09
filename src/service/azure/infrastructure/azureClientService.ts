import { SubscriptionClient } from '@azure/arm-resources-subscriptions'
import { WebSiteManagementClient } from '@azure/arm-appservice'
import { AzureWebAppClient } from '../../../domain/azure/azureWebAppClient'

export class AzureClientService {
  constructor (private readonly credential: any, private readonly subscriptionName: string) {
  }

  getSubscriptionClient (): SubscriptionClient {
    return new SubscriptionClient(this.credential)
  }

  async getSubscriptionId (): Promise<string> {
    const client = this.getSubscriptionClient()
    for await (const sub of client.subscriptions.list()) {
      if (sub.displayName === this.subscriptionName && sub.subscriptionId !== undefined) {
        return sub.subscriptionId
      }
    }
    throw new Error(`Subscription with name '${this.subscriptionName}' not found`)
  }

  async getWebsiteManagementClient (): Promise<AzureWebAppClient> {
    const subscriptionId = await this.getSubscriptionId()
    const client = new WebSiteManagementClient(this.credential, subscriptionId)
    return new AzureWebAppClient(client)
  }
}
