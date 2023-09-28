import config from '../../../config'
import log from 'log'
import { type MIReportPersonalisation, type PasswordPersonalisation } from './personalisations'
import { GovUkEmailNotification, GovUkNotification } from './GovUkEmailNotification'
import { type UploadResult } from '../../azure/storage/blob/service'
import { getNotifier } from './GovUkNotifier'
import dayjs from 'dayjs'
import { OrgDomainsEmailPersonalisation } from '../../orgDomains/model/emailPersonalisation'

const { jobs: { courseCompletions, orgDomains } } = config
const dateFormatTokens = 'DD/MM/YYYY'

const notifications: GovUkEmailNotification[] = [
  new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS, courseCompletions.notifyTemplate, courseCompletions.emailRecipients),
  new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS_PASSWORD, courseCompletions.notifyPasswordTemplate, courseCompletions.emailRecipients),
  new GovUkEmailNotification(GovUkNotification.ORG_DOMAIN, orgDomains.notifyTemplate, orgDomains.emailRecipients)
]

const sendEmail = async (notificationType: GovUkNotification, personalisation: any): Promise<void> => {
  const notifier = getNotifier()
  if (notifier !== undefined) {
    const notification = notifications.filter(n => n.notificationId === notificationType)[0]
    await notifier.send(notification, personalisation)
  } else {
    log.warn(`Notification '${notificationType}' cannot be sent as the Govuk notifier has not been configured`)
  }
}

export const sendCourseCompletionsNotification = async (fromDate: Date, toDate: Date, uploadResult: UploadResult): Promise<void> => {
  const fromFmt = dayjs(fromDate).format(dateFormatTokens)
  const toFmt = dayjs(toDate).format(dateFormatTokens)
  const personalisation: MIReportPersonalisation = {
    description: `Course completions from ${fromFmt} to ${toFmt}`,
    linkExpiryInDays: uploadResult.expiryInDays,
    link: uploadResult.link
  }
  await sendEmail(GovUkNotification.COURSE_COMPLETIONS, personalisation)
}

export const sendCourseCompletionsPasswordNotification = async (fromDate: Date, toDate: Date, password: string): Promise<void> => {
  const fromFmt = dayjs(fromDate).format(dateFormatTokens)
  const toFmt = dayjs(toDate).format(dateFormatTokens)
  const personalisation: PasswordPersonalisation = {
    description: `Course completions from ${fromFmt} to ${toFmt}`,
    password
  }
  await sendEmail(GovUkNotification.COURSE_COMPLETIONS_PASSWORD, personalisation)
}

export const sendOrgDomainsNotification = async (description: string, dateCreated: Date, uploadResult: UploadResult): Promise<void> => {
  const formattedDate = dayjs(dateCreated).format(dateFormatTokens)
  const personalisation: OrgDomainsEmailPersonalisation = {
    description,
    date: formattedDate,
    link: uploadResult.link,
    daysUntilExpiry: uploadResult.expiryInDays
  }

  await sendEmail(GovUkNotification.ORG_DOMAIN, personalisation)
}