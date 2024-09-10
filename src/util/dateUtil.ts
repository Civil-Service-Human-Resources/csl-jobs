import dayjs, { type Dayjs } from 'dayjs'

import advancedFormat from 'dayjs/plugin/advancedFormat'

import timezone from 'dayjs/plugin/timezone'

import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)
const tz = 'Europe/London'

export function getClientsideDayJS (obj?: string): Dayjs {
  if (obj !== undefined) {
    return dayjs(obj).tz(tz)
  }
  return dayjs().tz(tz)
}
