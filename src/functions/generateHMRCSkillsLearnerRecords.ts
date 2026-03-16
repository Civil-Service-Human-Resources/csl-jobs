import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import { JobType } from '../service/job/JobType'
import { runJob } from '../service/job/jobService'

const { jobs: { HMRCLearnerRecords: { cron, runOnStartup } } } = config

export async function generateHMRCSkillsLearnerRecords (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await runJob(JobType.HMRC_SKILLS_COMPLETED_LEARNER_RECORDS)
}

app.timer('generateHMRCSkillsLearnerRecords', {
  schedule: cron,
  handler: generateHMRCSkillsLearnerRecords,
  runOnStartup
})
