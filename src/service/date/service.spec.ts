import { expect } from 'chai'
import { CustomDate } from './CustomDate'
import { getNewDateFromDateWithDuration } from './service'

describe('Date service tests', () => {
  describe('getNewDateFromDateWithDuration', () => {
    const exampleDate = new CustomDate('2023-02-02 01:01:01')
    it('should add a duration onto a given date and return the new date', () => {
      const newDate = getNewDateFromDateWithDuration(exampleDate, 'P1D', 'add')
      expect(newDate.getDate()).to.equal(3)
    })
    it('should subtract a duration from a given date and return the new date', () => {
      const newDate = getNewDateFromDateWithDuration(exampleDate, 'P1Y', 'subtract')
      expect(newDate.getFullYear()).to.equal(2022)
    })
  })
})
