import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import * as identity from '../service/identity'

const { jobs: { duplicateTokens } } = config

export async function clearDuplicateTokens (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await identity.clearDuplicateTokens()
}

app.timer('clearDuplicateTokens', {
  schedule: duplicateTokens.cron,
  handler: clearDuplicateTokens,
  runOnStartup: duplicateTokens.runOnStartup
})
