import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import { runJob } from '../service/job/jobService'
import { JobType } from '../service/job/JobType'

const { jobs: { duplicateTokens } } = config

export async function clearDuplicateTokens (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await runJob(JobType.DUPLICATE_TOKEN)
}

app.timer('clearDuplicateTokens', {
  schedule: duplicateTokens.cron,
  handler: clearDuplicateTokens,
  runOnStartup: duplicateTokens.runOnStartup
})
