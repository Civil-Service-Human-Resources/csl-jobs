import * as tableService from '../service/azure/storage/table'
import * as govNotifyClient from '../service/notification/govUKNotify/govUkNotify'
import log from 'log'
import { runJob } from './job/jobService'
import { generateCourseCompletionsReportZip } from './reporting/reportService'

export const generateCourseCompletions = async (): Promise<void> => {
  await runJob({
    jobFunc: async () => {
      log.info('Getting course completions')
      const toTimestamp = generateToTimestamp()
      let lastSuccessTimestamp = await getLastSuccessTimestamp()
      if (lastSuccessTimestamp === undefined) {
        log.info('Last run timestamp does not exist - calculating from fallback duration')
        lastSuccessTimestamp = new Date(toTimestamp)
        lastSuccessTimestamp.setFullYear(lastSuccessTimestamp.getFullYear() - 1)
      }
      const zipReport = await generateCourseCompletionsReportZip(lastSuccessTimestamp, toTimestamp)
      if (zipReport !== undefined) {
        await Promise.all(
          [govNotifyClient.sendCourseCompletionsNotification(
            lastSuccessTimestamp.toLocaleDateString(),
            toTimestamp.toLocaleDateString(),
            zipReport.uploadResult),
          govNotifyClient.sendCourseCompletionsPasswordNotification(
            lastSuccessTimestamp.toLocaleDateString(),
            toTimestamp.toLocaleDateString(),
            zipReport.zip.password)]
        )
        await tableService.upsertJobData('courseCompletions', 'lastReportToTimestamp', toTimestamp.toISOString())
        return {
          text: `Successfully generated and sent course completions file '${zipReport.zip.result.filename}'`
        }
      } else {
        return {
          text: 'Found 0 course completions for the specified time period'
        }
      }
    },
    name: 'Course completions report'
  })
}

const generateToTimestamp = (): Date => {
  const date = new Date()
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  date.setHours(date.getHours() + Math.abs(date.getTimezoneOffset() / 60))
  return date
}

const getLastSuccessTimestamp = async (): Promise<Date | undefined> => {
  log.info('Getting last successful report timestamp')
  const lastSuccessTimestampStr = await tableService.getJobData('courseCompletions', 'lastReportToTimestamp')
  log.info(`Last successful report timestamp was ${lastSuccessTimestampStr ?? 'undefined'}`)
  if (lastSuccessTimestampStr !== undefined) {
    const date = new Date(lastSuccessTimestampStr)
    date.setHours(date.getHours() + Math.abs(date.getTimezoneOffset() / 60))
    return date
  }
  return undefined
}
