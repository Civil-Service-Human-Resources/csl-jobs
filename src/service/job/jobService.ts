import log = require('log')
import { getNotificationClient } from '../notification/notifications'
import { JobType } from './JobType'
import { type Job } from './Job'
import { CourseCompletionsJob } from './MI/CourseCompletionsJob'
import config from '../../config'
import { ClearRedundantTokensJob } from './identity/ClearRedundantTokensJob'
import { ClearDuplicateTokensJob } from './identity/ClearDuplicateTokensJob'

const notificationClient = getNotificationClient()

export interface JobResult {
  text: string
}

export const runJob = async (jobType: JobType): Promise<void> => {
  let job: Job | undefined
  switch (jobType) {
    case JobType.COURSE_COMPLETIONS:
      job = new CourseCompletionsJob(notificationClient, config.jobs.courseCompletions.defaultFallbackPeriod)
      break
    case JobType.REDUNDANT_TOKEN:
      job = new ClearRedundantTokensJob(notificationClient)
      break
    case JobType.DUPLICATE_TOKEN:
      job = new ClearDuplicateTokensJob(notificationClient)
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
