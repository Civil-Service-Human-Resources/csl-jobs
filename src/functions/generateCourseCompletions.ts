import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import { JobType } from '../service/job/JobType'
import { runJob } from '../service/job/jobService'

const { jobs: { courseCompletions: { cron } } } = config

export async function generateCourseCompletions (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await runJob(JobType.COURSE_COMPLETIONS)
}

app.timer('generateCourseCompletions', {
  schedule: cron,
  handler: generateCourseCompletions
})
