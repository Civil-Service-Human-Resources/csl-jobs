import { expect } from 'chai'
import { GovUkEmailNotification, GovUkNotification } from './GovUkEmailNotification'

describe('GovUkEmailNotification tests', () => {
  it('Should return true to indicate an email can be sent', () => {
    const notification = new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS, 'templateId', ['recipient1'])
    expect(notification.canSend()).eq(true)
  })
  it('Should return false to indicate an email cannot be sent', () => {
    const notification = new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS, '', [])
    expect(notification.canSend()).eq(false)
  })
})
