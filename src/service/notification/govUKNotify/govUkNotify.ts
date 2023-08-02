import * as govUkNotify from 'notifications-node-client'
import config from '../../../config'
import log = require('log')
import { type MIReportPersonalisation, type PasswordPersonalisation } from './personalisations'
import { GovUkEmailNotification, GovUkNotification } from './GovUkEmailNotification'
import { GovUKEmailer } from './GovUKEmailer'
import { type UploadResult } from '../../azure/storage/blob'

const { notifications: { govNotify }, jobs: { courseCompletions } } = config

const notifications: GovUkEmailNotification[] = []
const emailer = govNotify.apiKey !== undefined ? new GovUKEmailer(new govUkNotify.NotifyClient(govNotify.apiKey)) : undefined

const setUpNotifications = (): void => {
  notifications.push(new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS, courseCompletions.notifyTemplate, courseCompletions.emailRecipients))
  notifications.push(new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS_PASSWORD, courseCompletions.notifyPasswordTemplate, courseCompletions.emailRecipients))
}

const send = async (notificationSpec: GovUkNotification, personalisation: any): Promise<void> => {
  log.debug(`Attempting to send email '${notificationSpec}' with personalisation:`)
  log.debug(personalisation)
  if (emailer !== undefined) {
    if (notifications.length === 0) {
      setUpNotifications()
    }
    const notification = notifications.filter(n => n.notificationId === notificationSpec)[0]
    if (notification.canSend()) {
      try {
        await emailer.send(notification, personalisation)
      } catch (error) {
        const req = error.response
        log.error(`There were error(s) sending a '${notificationSpec}' notify email:`)
        const errors = req.data.errors as any[]
        errors.forEach(e => { log.error(e) })
      }
    } else {
      log.warn(`Notification '${notificationSpec}' cannot be sent as it is missing configuration parameters`)
    }
  } else {
    log.warn(`Notification '${notificationSpec}' cannot be sent as GOVUK_NOTIFY_API_KEY is not set`)
  }
}

export const sendCourseCompletionsNotification = async (fromDate: string, toDate: string, uploadResult: UploadResult): Promise<void> => {
  const personalisation: MIReportPersonalisation = {
    description: `Course completions from ${fromDate} to ${toDate}`,
    linkExpiryInDays: uploadResult.expiryInDays,
    link: uploadResult.link
  }
  await send(GovUkNotification.COURSE_COMPLETIONS, personalisation)
}

export const sendCourseCompletionsPasswordNotification = async (fromDate: string, toDate: string, password: string): Promise<void> => {
  const personalisation: PasswordPersonalisation = {
    description: `Course completions from ${fromDate} to ${toDate}`,
    password
  }
  await send(GovUkNotification.COURSE_COMPLETIONS_PASSWORD, personalisation)
}
