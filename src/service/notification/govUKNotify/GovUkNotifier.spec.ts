import sinon from 'sinon'
import { GovUkEmailNotification, GovUkNotification } from './GovUkEmailNotification'
import { GovUkNotifier } from './GovUkNotifier'

describe('govUKNotify tests', () => {
  describe('send email tests', () => {
    const client: any = {}
    it('Should send an email to the specified recipients', async () => {
      client.sendEmail = sinon.stub()
      const notification = new GovUkEmailNotification(GovUkNotification.COURSE_COMPLETIONS, 'testId', ['recipient1', 'recipient2'])
      const emailer = new GovUkNotifier(client)
      const personalisation = {
        name: 'test'
      }
      await emailer.send(notification, personalisation)
      sinon.assert.calledWith(client.sendEmail, 'testId', 'recipient1', { personalisation })
      sinon.assert.calledWith(client.sendEmail, 'testId', 'recipient2', { personalisation })
    })
  })
})
