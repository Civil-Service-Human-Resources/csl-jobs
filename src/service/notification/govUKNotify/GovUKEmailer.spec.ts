import { GovUKEmailer } from './GovUKEmailer'
import { GovUkEmailNotification, GovUkNotification } from './GovUkEmailNotification'
import { expect } from 'chai'
import sinon from 'sinon'

describe('GovUKEmailer tests', () => {
  const client: any = {}
  it('Should send an email', async () => {
    client.sendEmail = sinon.stub()
    const notification = new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS, 'testId', ['recipient1', 'recipient2'])
    const emailer = new GovUKEmailer(client)
    const personalisation = {
      name: 'test'
    }
    await emailer.send(notification, personalisation)
    expect(client.sendEmail.calledWith('testId', 'recipient1', notification, personalisation))
    expect(client.sendEmail.calledWith('testId', 'recipient2', notification, personalisation))
    expect(client.sendEmail.calledWith('testId', 'recipient3', notification, personalisation))
  })
})
