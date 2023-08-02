import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import * as MI from '../service/MI'

const { jobs: { courseCompletions: { cron } } } = config

export async function generateCourseCompletions (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await MI.generateCourseCompletions()
}

app.timer('clearDuplicateTokens', {
  schedule: cron,
  handler: generateCourseCompletions
})
