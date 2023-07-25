import { type Notifier } from './Notifier'
import { type WebClient } from '@slack/web-api'

export class SlackNotifier implements Notifier {
  constructor (private readonly client: WebClient, private readonly channelId: string) {}

  getName = (): string => {
    return 'Slack'
  }

  notify = async (message: string): Promise<void> => {
    await this.client.chat.postMessage({
      text: message,
      channel: this.channelId
    })
  }
}
