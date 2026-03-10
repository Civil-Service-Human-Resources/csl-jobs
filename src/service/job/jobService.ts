import log = require('log')
import { getNotificationClient } from '../notification/notifications'
import { JobType } from './JobType'
import { type Job } from './Job'
import { CourseCompletionsJob } from './MI/CourseCompletionsJob'
import { SkillsCompletionsJob } from './MI/SkillsCompletionsJob'
import config from '../../config'
import { ClearRedundantTokensJob } from './identity/ClearRedundantTokensJob'
import { ClearDuplicateTokensJob } from './identity/ClearDuplicateTokensJob'
import { OrgDomainsJob } from './orgDomains/orgDomainsJob'
import { OBTStatsJob } from './MI/OBTStats'
import { HMRCSkillsJob } from './MI/HMRCSkillsJob'
import { type TableService } from '../azure/storage/table/service'
import { JobTableService } from '../azure/storage/table/jobTableService'

export interface JobResult {
  text: string
}

export const runJob = async (jobType: JobType): Promise<void> => {
  const notificationClient = getNotificationClient(jobType.valueOf())
  let job: Job | undefined
  let tableService: TableService | undefined
  switch (jobType) {
    case JobType.COURSE_COMPLETIONS:
      tableService = new JobTableService('courseCompletions')
      job = new CourseCompletionsJob(notificationClient, config.jobs.courseCompletions.defaultFallbackPeriod, tableService)
      break
    case JobType.SKILLS_COMPLETED_LEARNER_RECORDS:
      tableService = new JobTableService('skillsSync')
      job = new SkillsCompletionsJob(notificationClient, config.jobs.skillsCompletedLearnerRecords.defaultFallbackPeriod, tableService)
      break
    case JobType.HMRC_SKILLS_COMPLETED_LEARNER_RECORDS: {
      tableService = new JobTableService('HMRCSkillsSync')
      job = new HMRCSkillsJob(notificationClient, config.jobs.HMRCLearnerRecords, tableService)
      break
    }
    case JobType.REDUNDANT_TOKEN:
      job = new ClearRedundantTokensJob(notificationClient)
      break
    case JobType.DUPLICATE_TOKEN:
      job = new ClearDuplicateTokensJob(notificationClient)
      break
    case JobType.ORG_DOMAINS:
      job = new OrgDomainsJob(notificationClient)
      break
    case JobType.OBT_STATS:
      tableService = new JobTableService('obtStats')
      job = new OBTStatsJob(notificationClient, config.jobs.obtStats.defaultFallbackPeriod,
        config.jobs.obtStats.bucketAlias, config.jobs.obtStats.keySubfolder,
        config.jobs.obtStats.courseIds, tableService)
      break
    default:
      job = undefined
      break
  }
  if (job !== undefined) {
    await job.execute()
  } else {
    log.error(`Failed to execute '${jobType}' job; job does not exist`)
  }
}
