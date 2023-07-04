import { SLACK_API_TOKEN, SLACK_CHANNEL_NOTIFICATION_ID } from '../../config'
import { type Notifier } from './Notifier'
import { WebClient } from '@slack/web-api'
import { SlackNotifier } from './SlackNotifier'
import log = require('log')

export class NotificationClient {
  constructor (private readonly notifiers: Notifier[]) {}

  notify = async (message: string): Promise<void> => {
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

const _notifiers: Notifier[] = []

const getNotifiers = (): Notifier[] => {
  try {
    log.debug('Building notifiers')
    if (_notifiers.length === 0) {
      if (SLACK_API_TOKEN !== undefined && SLACK_CHANNEL_NOTIFICATION_ID !== undefined) {
        log.debug('Slack token and channel ID provided, building slack notifier')
        const slackClient = new WebClient(SLACK_API_TOKEN)
        const slackNotifier = new SlackNotifier(slackClient, SLACK_CHANNEL_NOTIFICATION_ID)
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
  return new NotificationClient(notifiers)
}
