import log from 'log'
import { type GovUkEmailNotification } from './GovUkEmailNotification'
import type * as govUkNotify from 'notifications-node-client'

export class GovUKEmailer {
  constructor (private readonly client: govUkNotify.NotifyClient) { }

  async send (notification: GovUkEmailNotification, personalisation: any): Promise<void> {
    log.info(`Sending email to ${notification.recipients.length} recipients`)
    await Promise.all(notification.recipients.map(async r => {
      log.debug(`Sending email to '${r}'`)
      return await this.client.sendEmail(notification.templateId, r, {
        personalisation
      })
    }))
  }
}
