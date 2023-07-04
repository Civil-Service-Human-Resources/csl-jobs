import { app, type InvocationContext, type Timer } from '@azure/functions'
import { REDUNDANT_TOKEN_CRON, REDUNDANT_TOKEN_RUN_ON_STARUP } from '../config'
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
  runOnStartup: REDUNDANT_TOKEN_RUN_ON_STARUP
})
