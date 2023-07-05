import log = require('log')
import { NOTIFICATION_LEVEL, getNotificationClient } from '../notification/notifications'

const notificationClient = getNotificationClient()

interface JobResult {
  text: string
}

interface jobOpts {
  name: string
  jobFunc: () => Promise<JobResult>
}

export const runJob = async (opts: jobOpts): Promise<JobResult> => {
  await notificationClient.notify(`Starting job '${opts.name}'`, NOTIFICATION_LEVEL.ALL)
  try {
    const res = await opts.jobFunc()
    await notificationClient.notify(`Job '${opts.name}' ran successfully with result message '${res.text}'`, NOTIFICATION_LEVEL.ALL)
    return res
  } catch (e) {
    const errorMsg = e as string
    log.error(`Exception running job ${opts.name}: ${errorMsg}`)
    await notificationClient.notify(`Job '${opts.name}' FAILED.`, NOTIFICATION_LEVEL.ERROR)
    throw e
  }
}
