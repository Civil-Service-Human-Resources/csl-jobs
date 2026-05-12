import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import { runJob } from '../service/job/jobService'
import { JobType } from '../service/job/JobType'

const { jobs: { scaleAppServices: { cron, runOnStartup } } } = config

export async function scaleAppServices (myTimer: Timer, context: InvocationContext): Promise<void> {
  await runJob(JobType.SCALE_APP_SERVICES)
}

app.timer('scaleAppServices', {
  schedule: cron,
  handler: scaleAppServices,
  runOnStartup
})
