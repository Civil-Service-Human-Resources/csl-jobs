import config from '../../../config'
import log from 'log'
import { type MIReportPersonalisation, type PasswordPersonalisation } from './personalisations'
import { GovUkEmailNotification, GovUkNotification } from './GovUkEmailNotification'
import { type UploadResult } from '../../azure/storage/blob/service'
import { getNotifier } from './GovUkNotifier'
import dayjs from 'dayjs'
import type { OrgDomainsEmailPersonalisation } from '../../orgDomains/model/emailPersonalisation'
import type { PasswordEmailPersonalisation } from '../../orgDomains/model/PasswordEmailPersonalisation'

const { jobs: { courseCompletions, orgDomains }, notifications: { govNotify: { genericTemplates } } } = config
const dateFormatTokens = 'DD/MM/YYYY'

const notifications: GovUkEmailNotification[] = [
  new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS, courseCompletions.notifyTemplate),
  new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS_PASSWORD, courseCompletions.notifyPasswordTemplate),
  new GovUkEmailNotification(GovUkNotification.ORG_DOMAIN, orgDomains.notifyTemplate),
  new GovUkEmailNotification(GovUkNotification.ORG_DOMAIN_PASSWORD, orgDomains.passwordNotifyTemplate),
  new GovUkEmailNotification(GovUkNotification.SKILLS_FILE_DOWNLOAD, genericTemplates.fileDownload),
  new GovUkEmailNotification(GovUkNotification.SKILLS_FILE_DOWNLOAD_PASSWORD, genericTemplates.fileDownloadPassword),
  new GovUkEmailNotification(GovUkNotification.SKILLS_EMPTY_FILE, genericTemplates.emptyFileNotification)
]

const sendEmail = async (notificationType: GovUkNotification, personalisation: any, recipients: string[]): Promise<number> => {
  let emailSent = 0
  const notifier = getNotifier()
  if (notifier !== undefined) {
    const notification = notifications.filter(n => n.notificationId === notificationType)[0]
    emailSent = await notifier.send(notification, personalisation, recipients)
  } else {
    log.warn(`Notification '${notificationType}' cannot be sent as the Govuk notifier has not been configured`)
  }
  return emailSent
}

export const sendSkillsBlankFileNotification = async (recipients: string[]): Promise<number> => {
  return await sendEmail(GovUkNotification.SKILLS_EMPTY_FILE, {}, recipients)
}

export const sendSkillsFileNotification = async (uploadResult: UploadResult, description: string, recipients: string[]): Promise<number> => {
  const personalisation: MIReportPersonalisation = {
    description,
    linkExpiryInDays: uploadResult.expiryInDays,
    link: uploadResult.link
  }
  return await sendEmail(GovUkNotification.SKILLS_FILE_DOWNLOAD, personalisation, recipients)
}

export const sendSkillsFilePasswordNotification = async (password: string, description: string, recipients: string[]): Promise<number> => {
  const personalisation: PasswordPersonalisation = {
    description,
    password
  }
  return await sendEmail(GovUkNotification.SKILLS_FILE_DOWNLOAD_PASSWORD, personalisation, recipients)
}

export const sendCourseCompletionsNotification = async (fromDate: Date, toDate: Date, uploadResult: UploadResult): Promise<number> => {
  const fromFmt = dayjs(fromDate).format(dateFormatTokens)
  const toFmt = dayjs(toDate).format(dateFormatTokens)
  const personalisation: MIReportPersonalisation = {
    description: `Course completions from ${fromFmt} to ${toFmt}`,
    linkExpiryInDays: uploadResult.expiryInDays,
    link: uploadResult.link
  }
  return await sendEmail(GovUkNotification.COURSE_COMPLETIONS, personalisation, courseCompletions.emailRecipients)
}

export const sendCourseCompletionsPasswordNotification = async (fromDate: Date, toDate: Date, password: string): Promise<number> => {
  const fromFmt = dayjs(fromDate).format(dateFormatTokens)
  const toFmt = dayjs(toDate).format(dateFormatTokens)
  const personalisation: PasswordPersonalisation = {
    description: `Course completions from ${fromFmt} to ${toFmt}`,
    password
  }
  return await sendEmail(GovUkNotification.COURSE_COMPLETIONS_PASSWORD, personalisation, courseCompletions.emailRecipients)
}

export const sendOrgDomainsNotification = async (description: string, dateCreated: Date, uploadResult: UploadResult): Promise<number> => {
  const formattedDate = dayjs(dateCreated).format(dateFormatTokens)
  const personalisation: OrgDomainsEmailPersonalisation = {
    description,
    date: formattedDate,
    link: uploadResult.link,
    daysUntilExpiry: uploadResult.expiryInDays
  }

  return await sendEmail(GovUkNotification.ORG_DOMAIN, personalisation, orgDomains.emailRecipients)
}

export const sendOrgDomainsPasswordNotification = async (description: string, password: string): Promise<number> => {
  const personalisation: PasswordEmailPersonalisation = {
    description,
    password
  }
  return await sendEmail(GovUkNotification.ORG_DOMAIN_PASSWORD, personalisation, orgDomains.emailRecipients)
}
