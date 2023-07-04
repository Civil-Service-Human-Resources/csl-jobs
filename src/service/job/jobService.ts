import log = require('log')
import { getNotificationClient } from '../notification/notifications'

const notificationClient = getNotificationClient()

interface jobOpts {
  name: string
  jobFunc: () => Promise<void>
}

export const runJob = async (opts: jobOpts): Promise<void> => {
  await notificationClient.notify(`Starting job '${opts.name}'`)
  try {
    await opts.jobFunc()
  } catch (e) {
    const errorMsg = e as string
    log.error(`Exception running job ${opts.name}: ${errorMsg}`)
    await notificationClient.notify(`Job '${opts.name}' FAILED.`)
    throw e
  }
  await notificationClient.notify(`Job '${opts.name}' ran successfully`)
}
