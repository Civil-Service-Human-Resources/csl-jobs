import { SkillsJob, type SkillsJobConfig } from './SkillsJob'
import { type NotificationClient } from '../../notification/notifications'
import { type FtpService } from '../../ftp/ftpService'
import { type TableService } from '../../azure/storage/table/service'

export class HMRCSkillsJob extends SkillsJob {
  constructor (notificationClient: NotificationClient, config: SkillsJobConfig, ftpService: FtpService,
    tableService: TableService) {
    super(notificationClient, tableService, config, ftpService)
  }

  getName (): string {
    return 'HMRC skills campus extract job'
  }
}
