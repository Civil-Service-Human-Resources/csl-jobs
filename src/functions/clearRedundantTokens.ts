import { app, type InvocationContext, type Timer } from '@azure/functions'
import config from '../config'
import * as identity from '../service/identity'

const { jobs: { redundantTokens } } = config

export async function clearRedundantTokens (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  await identity.clearRedundantTokens()
}

app.timer('clearRedundantTokens', {
  schedule: redundantTokens.cron,
  handler: clearRedundantTokens,
  runOnStartup: redundantTokens.runOnStartup
})
