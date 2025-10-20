import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import { JobType } from '../service/job/JobType'
import { runJob } from '../service/job/jobService'

const { jobs: { skillsCompletedLearnerRecords: { cron, runOnStartup } } } = config

export async function generateSkillsCompletedLearnerRecords (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await runJob(JobType.SKILLS_COMPLETED_LEARNER_RECORDS)
}

app.timer('generateSkillsCompletedLearnerRecords', {
  schedule: cron,
  handler: generateSkillsCompletedLearnerRecords,
  runOnStartup
})
