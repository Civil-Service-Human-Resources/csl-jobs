import * as notifier from './GovUkNotifier'
import sinon from 'sinon'
import { sendCourseCompletionsNotification, sendCourseCompletionsPasswordNotification } from './govUkNotify'
import { GovUkEmailNotification } from './GovUkEmailNotification'

describe('govUkNotify tests', () => {
  const testDate = new Date('2023-01-01 01:01:00')
  const sandbox = sinon.createSandbox()
  const GovUkNotifier: any = {}
  before(() => {
    sandbox.useFakeTimers(testDate)
    GovUkNotifier.send = sandbox.stub().resolves()
    sandbox.stub(notifier, 'getNotifier').returns(GovUkNotifier)
  })
  after(() => {
    sandbox.clock.restore()
  })
  it('sendCourseCompletionsNotification', async () => {
    await sendCourseCompletionsNotification(testDate, testDate, {
      expiryInDays: 1,
      link: 'URL'
    })
    sandbox.assert.calledWith(GovUkNotifier.send, sandbox.match.instanceOf(GovUkEmailNotification), {
      description: 'Course completions from 01/01/2023 to 01/01/2023',
      linkExpiryInDays: 1,
      link: 'URL'
    })
  })
  it('sendCourseCompletionsPasswordNotification', async () => {
    await sendCourseCompletionsPasswordNotification(testDate, testDate, 'password')
    sandbox.assert.calledWith(GovUkNotifier.send, sandbox.match.instanceOf(GovUkEmailNotification), {
      description: 'Course completions from 01/01/2023 to 01/01/2023',
      password: 'password'
    })
  })
})
