import { type CustomDate } from '../../date/CustomDate'

export interface DateRange extends PartialDateRange {
  fromDate: CustomDate
}

export interface PartialDateRange {
  fromDate?: CustomDate
  toDate: CustomDate
}

export interface DateRangeJob {
  getFromAndToDates: () => Promise<PartialDateRange>
  getFromAndToDatesWithFallback: () => Promise<DateRange>
}
