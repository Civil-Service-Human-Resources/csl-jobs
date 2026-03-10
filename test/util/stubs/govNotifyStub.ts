import nock, { type Scope } from 'nock'

export interface SkillsExtractPasswordBody {
  description: string
  password: string
}

export interface SkillsExtractBody {
  description: string
  linkExpiryInDays: number
  link: string | RegExp
}

export const createSendEmailStub = (emailAddress: string, templateId: string, personalisation: any): Scope => {
  return nock('https://api.notifications.service.gov.uk')
    .post('/v2/notifications/email', {
      template_id: templateId,
      email_address: emailAddress,
      personalisation
    })
    .reply(200)
}

export const createSkillsExtractPasswordEmailStub = (recipient: string, expBody: SkillsExtractPasswordBody): Scope => {
  return createSendEmailStub(recipient, 'fileDownloadPassword', expBody)
}

export const createSkillsEmptyFileNotification = (recipient: string): Scope => {
  return createSendEmailStub(recipient, 'emptyFile', {})
}

export const createSkillsExtractEmailStub = (recipient: string, expBody: SkillsExtractBody): Scope => {
  if (!(expBody.link instanceof RegExp)) {
    expBody.link = new RegExp(`^${expBody.link}`)
  }
  return createSendEmailStub(recipient, 'fileDownload', expBody)
}
