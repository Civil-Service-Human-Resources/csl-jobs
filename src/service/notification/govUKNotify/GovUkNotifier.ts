import * as govUkNotify from 'notifications-node-client'
import log from 'log'
import { type GovUkEmailNotification } from './GovUkEmailNotification'
import config from '../../../config'

const { notifications: { govNotify } } = config

export class GovUkNotifier {
  constructor (private readonly client: govUkNotify.NotifyClient) {}

  async send (notification: GovUkEmailNotification, personalisation: any): Promise<void> {
    if (notification.canSend()) {
      log.debug(`Attempting to send email '${notification.notificationId}' with personalisation:`)
      log.debug(personalisation)
      log.info(`Sending email to ${notification.recipients.length} recipients`)
      try {
        await Promise.all(notification.recipients.map(async r => {
          log.debug(`Sending email to '${r}'`)
          return await this.client.sendEmail(notification.templateId, r, {
            personalisation
          })
        }))
      } catch (error) {
        const req = error.response
        log.error(`There were error(s) sending a '${notification.notificationId}' notify email:`)
        const errors = req.data.errors as any[]
        errors.forEach(e => { log.error(e) })
      }
    } else {
      log.warn(`Notification '${notification.notificationId}' cannot be sent as it is missing configuration parameters`)
    }
  }
}

const notifier = govNotify.apiKey !== undefined ? new GovUkNotifier(new govUkNotify.NotifyClient(govNotify.apiKey)) : undefined

export const getNotifier = (): GovUkNotifier | undefined => {
  return notifier
}
