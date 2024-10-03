import { Job } from '../Job'
import { type CustomDate } from '../../date/CustomDate'

export interface DateRange {
  fromDate: CustomDate
  toDate: CustomDate
}

export abstract class DateRangeJob extends Job {
  abstract getFromAndToDates (): Promise<DateRange>
}
