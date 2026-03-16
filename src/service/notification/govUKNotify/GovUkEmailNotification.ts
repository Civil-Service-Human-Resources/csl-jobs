export enum GovUkNotification {
  COURSE_COMPLETIONS = 'COURSE_COMPLETIONS',
  COURSE_COMPLETIONS_PASSWORD = 'COURSE_COMPLETIONS_PASSWORD',
  ORG_DOMAIN = 'ORG_DOMAIN',
  ORG_DOMAIN_PASSWORD = 'ORG_DOMAIN_PASSWORD',
  SKILLS_FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  SKILLS_FILE_DOWNLOAD_PASSWORD = 'FILE_DOWNLOAD_PASSWORD',
  SKILLS_EMPTY_FILE = 'SKILLS_EMPTY_FILE',
}

export class GovUkEmailNotification {
  constructor (public readonly notificationId: GovUkNotification, public readonly templateId: string) { }
  canSend (): boolean {
    return (this.templateId.length > 0)
  }
}
