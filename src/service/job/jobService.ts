import log = require('log')
import { NOTIFICATION_LEVEL, getNotificationClient } from '../notification/notifications'

const notificationClient = getNotificationClient()

interface jobOpts {
  name: string
  jobFunc: () => Promise<void>
}

export const runJob = async (opts: jobOpts): Promise<void> => {
  await notificationClient.notify(`Starting job '${opts.name}'`, NOTIFICATION_LEVEL.ALL)
  try {
    await opts.jobFunc()
  } catch (e) {
    const errorMsg = e as string
    log.error(`Exception running job ${opts.name}: ${errorMsg}`)
    await notificationClient.notify(`Job '${opts.name}' FAILED.`, NOTIFICATION_LEVEL.ERROR)
    throw e
  }
  await notificationClient.notify(`Job '${opts.name}' ran successfully`, NOTIFICATION_LEVEL.ALL)
}
