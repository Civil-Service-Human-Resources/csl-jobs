import * as identity from './service/identity'
import * as MI from './service/MI'
import { parseArgs } from 'node:util'

const localJobs: Map<string, () => Promise<void>> = new Map<string, () => Promise<void>>([
  ['clearDuplicateTokens', identity.clearDuplicateTokens],
  ['clearRedundantTokens', identity.clearRedundantTokens],
  ['generateCourseCompletions', MI.generateCourseCompletions]
])

const args = parseArgs({
  options: {
    functionName: {
      type: 'string',
      short: 'f'
    }
  }
})

const validJobs = Array.from(localJobs.keys())

const functionName = args.values.functionName
if (functionName === undefined) {
  throw Error('Function name is required.')
}
const job = localJobs.get(functionName)
if (job === undefined) {
  const validNamesStr = validJobs.join(', ')
  throw Error(`${functionName} is not a valid job name. Valid job names are ${validNamesStr}`)
}

job()
  .then(() => { process.exit() })
  .catch((e) => {
    throw e
  })
