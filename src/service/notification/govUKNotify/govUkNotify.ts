import config from '../../../config'
import log from 'log'
import { type MIReportPersonalisation, type PasswordPersonalisation } from './personalisations'
import { GovUkEmailNotification, GovUkNotification } from './GovUkEmailNotification'
import { type UploadResult } from '../../azure/storage/blob/service'
import { getNotifier } from './GovUkNotifier'
import dayjs from 'dayjs'
import type { OrgDomainsEmailPersonalisation } from '../../orgDomains/model/emailPersonalisation'
import type { PasswordEmailPersonalisation } from '../../orgDomains/model/PasswordEmailPersonalisation'

const { jobs: { courseCompletions, orgDomains, skillsCompletedLearnerRecords }, notifications: { govNotify: { genericTemplates } } } = config
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

const sendEmail = async (notificationType: GovUkNotification, personalisation: any, recipients: string[]): Promise<void> => {
  const notifier = getNotifier()
  if (notifier !== undefined) {
    const notification = notifications.filter(n => n.notificationId === notificationType)[0]
    await notifier.send(notification, personalisation, recipients)
  } else {
    log.warn(`Notification '${notificationType}' cannot be sent as the Govuk notifier has not been configured`)
  }
}

export const sendSkillsBlankFileNotification = async (recipients: string[]): Promise<void> => {
  await sendEmail(GovUkNotification.SKILLS_EMPTY_FILE, {}, recipients)
}

export const sendSkillsFileNotification = async (uploadResult: UploadResult, description: string, recipients: string[]): Promise<void> => {
  const personalisation: MIReportPersonalisation = {
    description,
    linkExpiryInDays: uploadResult.expiryInDays,
    link: uploadResult.link
  }
  await sendEmail(GovUkNotification.SKILLS_FILE_DOWNLOAD, personalisation, recipients)
}

export const sendSkillsFilePasswordNotification = async (password: string, description: string, recipients: string[]): Promise<void> => {
  const personalisation: PasswordPersonalisation = {
    description,
    password
  }
  await sendEmail(GovUkNotification.SKILLS_FILE_DOWNLOAD_PASSWORD, personalisation, recipients)
}

export const sendCourseCompletionsNotification = async (fromDate: Date, toDate: Date, uploadResult: UploadResult): Promise<void> => {
  const fromFmt = dayjs(fromDate).format(dateFormatTokens)
  const toFmt = dayjs(toDate).format(dateFormatTokens)
  const personalisation: MIReportPersonalisation = {
    description: `Course completions from ${fromFmt} to ${toFmt}`,
    linkExpiryInDays: uploadResult.expiryInDays,
    link: uploadResult.link
  }
  await sendEmail(GovUkNotification.COURSE_COMPLETIONS, personalisation, skillsCompletedLearnerRecords.emailRecipients)
}

export const sendCourseCompletionsPasswordNotification = async (fromDate: Date, toDate: Date, password: string): Promise<void> => {
  const fromFmt = dayjs(fromDate).format(dateFormatTokens)
  const toFmt = dayjs(toDate).format(dateFormatTokens)
  const personalisation: PasswordPersonalisation = {
    description: `Course completions from ${fromFmt} to ${toFmt}`,
    password
  }
  await sendEmail(GovUkNotification.COURSE_COMPLETIONS_PASSWORD, personalisation, courseCompletions.emailRecipients)
}

export const sendOrgDomainsNotification = async (description: string, dateCreated: Date, uploadResult: UploadResult): Promise<void> => {
  const formattedDate = dayjs(dateCreated).format(dateFormatTokens)
  const personalisation: OrgDomainsEmailPersonalisation = {
    description,
    date: formattedDate,
    link: uploadResult.link,
    daysUntilExpiry: uploadResult.expiryInDays
  }

  await sendEmail(GovUkNotification.ORG_DOMAIN, personalisation, orgDomains.emailRecipients)
}

export const sendOrgDomainsPasswordNotification = async (description: string, password: string): Promise<void> => {
  const personalisation: PasswordEmailPersonalisation = {
    description,
    password
  }
  await sendEmail(GovUkNotification.ORG_DOMAIN_PASSWORD, personalisation, orgDomains.emailRecipients)
}
