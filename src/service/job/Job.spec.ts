import sinon from 'sinon'
import { Job } from './Job'
import { type JobResult } from './jobService'
import { expect } from 'chai'
import { type NotificationClient } from '../notification/notifications'

class FakeJob extends Job {
  constructor (protected readonly notificationClient: NotificationClient,
    private readonly runnable: () => Promise<JobResult>) {
    super(notificationClient)
    this.runnable = runnable
  }

  protected async runJob (): Promise<JobResult> {
    return await this.runnable()
  }

  public getName (): string {
    return 'Fake Job'
  }
}

describe('Job class tests', () => {
  const sandbox = sinon.createSandbox()
  const notificationClient: any = {}
  notificationClient.infoNotification = sandbox.stub().resolves()
  notificationClient.errorNotification = sandbox.stub().resolves()
  it('Should output notifications when a job has started and finished', async () => {
    const fakeJob = new FakeJob(notificationClient, async () => {
      return {
        text: 'Job finished'
      }
    })
    const result = await fakeJob.execute()
    expect(result.text).to.eq('Job finished')
    sandbox.assert.calledWith(notificationClient.infoNotification, 'Starting job \'Fake Job\'')
    sandbox.assert.calledWith(notificationClient.infoNotification, 'Job \'Fake Job\' ran successfully with result message \'Job finished\'')
  })
  it('Should report error notifications when a job has failed', async () => {
    const error = new Error('Error')
    const fakeJob = new FakeJob(notificationClient, async () => {
      throw error
    })
    try {
      await fakeJob.execute()
    } catch (error) {
      const e = error as Error
      expect(e.message).to.equal('Error')
    }
    sandbox.assert.calledWith(notificationClient.infoNotification, 'Starting job \'Fake Job\'')
    sandbox.assert.calledWith(notificationClient.errorNotification, 'Job \'Fake Job\' FAILED.')
  })
})
