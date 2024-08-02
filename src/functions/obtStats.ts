import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import { JobType } from '../service/job/JobType'
import { runJob } from '../service/job/jobService'

const { jobs: { obtStats: { cron } } } = config

export async function obtstats (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await runJob(JobType.OBT_STATS)
}

app.timer('obtStats', {
  schedule: cron,
  handler: obtstats
})
