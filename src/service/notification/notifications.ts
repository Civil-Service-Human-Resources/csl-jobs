import { type Notifier } from './Notifier'
import { WebClient } from '@slack/web-api'
import { SlackNotifier } from './SlackNotifier'
import log = require('log')
import config from '../../config'
import { NOTIFICATION_LEVEL } from './NotificationLevel'

const { notifications: { notificationLevel, slack } } = config

export class NotificationClient {
  constructor (private readonly notifiers: Notifier[], private readonly notificationLevel: NOTIFICATION_LEVEL) {}

  infoNotification = async (message: string): Promise<void> => {
    await this.notify(message, NOTIFICATION_LEVEL.ALL)
  }

  errorNotification = async (message: string): Promise<void> => {
    await this.notify(message, NOTIFICATION_LEVEL.ERROR)
  }

  private readonly notify = async (message: string, level: NOTIFICATION_LEVEL): Promise<void> => {
    log.info(message)
    if (level.valueOf() >= this.notificationLevel.valueOf()) {
      for (const notifier of this.notifiers) {
        try {
          log.debug(`Notifying ${notifier.getName()} with message: '${message}'`)
          await notifier.notify(message)
        } catch (e) {
          const exMessage = e as string
          log.error(`Error encountered while making notification to ${notifier.getName()} notifier. Error: ${exMessage}`)
        }
      }
    }
  }
}

const _notifiers: Notifier[] = []

const getNotifiers = (): Notifier[] => {
  try {
    log.debug('Building notifiers')
    if (_notifiers.length === 0) {
      if (slack.apiToken !== undefined && slack.alertChannelId !== undefined) {
        log.debug('Slack token and channel ID provided, building slack notifier')
        const slackClient = new WebClient(slack.apiToken)
        const slackNotifier = new SlackNotifier(slackClient, slack.alertChannelId)
        _notifiers.push(slackNotifier)
      } else {
        log.debug('SLACK_API_TOKEN and/or SLACK_CHANNEL_NOTIFICATION_ID were not defined, skipping slack notifier')
      }
    }
  } catch (e) {
    const exMessage = e as string
    log.error(`Error encountered while building notifiers. Error: ${exMessage}`)
  }
  return _notifiers
}

export const getNotificationClient = (): NotificationClient => {
  const notifiers = getNotifiers()
  return new NotificationClient(notifiers, notificationLevel)
}
