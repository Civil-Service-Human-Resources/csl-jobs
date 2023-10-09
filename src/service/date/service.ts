import { CustomDate } from './CustomDate'

type AddSubtract = 'add' | 'subtract'

export const getMidnightToday = (): CustomDate => {
  const date = new CustomDate()
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  date.fixOffset()
  return date
}

export const getNewDateFromDateWithDuration = (date: CustomDate, duration: string, addSubtract: AddSubtract): CustomDate => {
  const newDate = new CustomDate(date)
  if (addSubtract === 'add') {
    newDate.addDuration(duration)
  } else {
    newDate.subtractDuration(duration)
  }
  return newDate
}
