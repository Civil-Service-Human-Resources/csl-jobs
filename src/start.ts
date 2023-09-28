import { parseArgs } from 'node:util'
import { JobType } from './service/job/JobType'
import { runJob } from './service/job/jobService'

const localJobs: Map<string, JobType> = new Map<string, JobType>([
  ['clearDuplicateTokens', JobType.DUPLICATE_TOKEN],
  ['clearRedundantTokens', JobType.REDUNDANT_TOKEN],
  ['generateCourseCompletions', JobType.COURSE_COMPLETIONS],
  ['orgDomains', JobType.ORG_DOMAINS]
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

runJob(job)
  .then(() => { process.exit() })
  .catch((e) => {
    throw e
  })
