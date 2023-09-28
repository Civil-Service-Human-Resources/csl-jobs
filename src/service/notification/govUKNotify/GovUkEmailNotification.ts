export enum GovUkNotification {
  COURSE_COMPLETIONS = 'COURSE_COMPLETIONS',
  COURSE_COMPLETIONS_PASSWORD = 'COURSE_COMPLETIONS_PASSWORD',
  ORG_DOMAIN = 'ORG_DOMAIN'
}

export class GovUkEmailNotification {
  constructor (public readonly notificationId: GovUkNotification, public readonly templateId: string, public readonly recipients: string[]) { }
  canSend (): boolean {
    return (this.recipients.length > 0 && this.templateId.length > 0)
  }
}
