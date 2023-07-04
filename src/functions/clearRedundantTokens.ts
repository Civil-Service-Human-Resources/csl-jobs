import { app, type InvocationContext, type Timer } from '@azure/functions'
import { REDUNDANT_TOKEN_CRON } from '../config'
import * as identity from '../service/identity'

export async function clearRedundantTokens (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await identity.clearRedundantTokens()
}

app.timer('clearRedundantTokens', {
  schedule: REDUNDANT_TOKEN_CRON,
  handler: clearRedundantTokens,
  runOnStartup: false
})
