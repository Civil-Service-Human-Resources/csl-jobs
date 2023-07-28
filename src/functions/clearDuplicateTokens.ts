import { app, type InvocationContext, type Timer } from '@azure/functions'
import { DUPLICATE_TOKEN_CRON, DUPLICATE_TOKEN_RUN_ON_STARTUP } from '../config'
import * as identity from '../service/identity'

export async function clearDuplicateTokens (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await identity.clearDuplicateTokens()
  context.log('Timer function processed request.')
}

app.timer('clearDuplicateTokens', {
  schedule: DUPLICATE_TOKEN_CRON,
  handler: clearDuplicateTokens,
  runOnStartup: DUPLICATE_TOKEN_RUN_ON_STARTUP
})
