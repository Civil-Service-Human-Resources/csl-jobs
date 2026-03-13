import * as govUkNotify from 'notifications-node-client'
import log from 'log'
import { type GovUkEmailNotification } from './GovUkEmailNotification'
import config from '../../../config'

const { notifications: { govNotify } } = config

export class GovUkNotifier {
  constructor (private readonly client: govUkNotify.NotifyClient) {}

  async send (notification: GovUkEmailNotification, personalisation: any, recipients: string[]): Promise<number> {
    let emailsSent = 0
    if (notification.canSend()) {
      log.debug(`Attempting to send email '${notification.notificationId}' with personalisation:`)
      log.debug(personalisation)
      log.info(`Sending email to ${recipients.length} recipients`)
      try {
        await Promise.all(recipients.map(async r => {
          log.debug(`Sending email to '${r}'`)
          await this.client.sendEmail(notification.templateId, r, {
            personalisation
          })
          emailsSent++
          log.debug(`Email ${notification.notificationId} sent successfully`)
        }))
      } catch (error) {
        const errors: any[] = []
        if (error.response !== undefined) {
          const req = error.response
          log.error(`There were error(s) sending a '${notification.notificationId}' notify email:`)
          errors.push(...req.data.errors as any[])
        } else {
          errors.push(error)
        }
        errors.forEach(e => { log.error(e) })
      }
    } else {
      log.warn(`Notification '${notification.notificationId}' cannot be sent as it is missing configuration parameters`)
    }
    return emailsSent
  }
}

const notifier = govNotify.apiKey !== undefined ? new GovUkNotifier(new govUkNotify.NotifyClient(govNotify.apiKey)) : undefined

export const getNotifier = (): GovUkNotifier | undefined => {
  return notifier
}
