import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import { JobType } from '../service/job/JobType'
import { runJob } from '../service/job/jobService'

const { jobs: { setLoggingLevels: { cron, runOnStartup } } } = config

export async function resetLoggingLevels (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await runJob(JobType.SET_LOGGING_LEVELS)
}

app.timer('resetLoggingLevels', {
  schedule: cron,
  handler: resetLoggingLevels,
  runOnStartup
})
