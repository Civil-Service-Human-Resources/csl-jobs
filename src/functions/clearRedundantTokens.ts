import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import { runJob } from '../service/job/jobService'
import { JobType } from '../service/job/JobType'

const { jobs: { redundantTokens } } = config

export async function clearRedundantTokens (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await runJob(JobType.REDUNDANT_TOKEN)
}

app.timer('clearRedundantTokens', {
  schedule: redundantTokens.cron,
  handler: clearRedundantTokens,
  runOnStartup: redundantTokens.runOnStartup
})
