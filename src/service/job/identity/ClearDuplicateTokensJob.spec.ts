import sinon = require('sinon')
import { expect } from 'chai'
import * as identityDB from '../../../db/identity/database'
import { ClearDuplicateTokensJob } from './ClearDuplicateTokensJob'

describe('Test clear duplicates', () => {
  const notificationClient: any = {}
  notificationClient.infoNotification = sinon.stub()
  const sandbox = sinon.createSandbox()
  const clearDuplicateTokensJob = new ClearDuplicateTokensJob(notificationClient)
  it('should delete duplicates if some have been found', async () => {
    const tokenRow: any = {
      authentication_id: 'auth_id',
      client_id: 'client_id'
    }
    const deact = sandbox.stub(identityDB, 'deactivateTokens')
    sandbox.stub(identityDB, 'getDuplicateTokens').resolves([tokenRow])
    const result = await clearDuplicateTokensJob.execute()
    sandbox.assert.calledWith(deact, ['auth_id'])
    expect(result.text).to.equal('Deactivated 1 duplicate tokens')
  })
})
