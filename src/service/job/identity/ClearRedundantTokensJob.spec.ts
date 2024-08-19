import sinon = require('sinon')
import { expect } from 'chai'
import * as identityDB from '../../../db/identity/database'
import { ClearRedundantTokensJob } from './ClearRedundantTokensJob'

describe('Test clear redundant tokens', () => {
  const notificationClient: any = {}
  notificationClient.infoNotification = sinon.stub()
  const sandbox = sinon.createSandbox()
  const clearRedundantTokensJob = new ClearRedundantTokensJob(notificationClient)
  beforeEach(() => {
    deleteValidTokens.reset()
    deleteInvalidTokens.reset()
  })
  sandbox.stub(identityDB, 'countAllTokens').resolves(0)
  sandbox.stub(identityDB, 'countAllValidNonUserTokens').resolves(0)
  const countAllInvalidNonUserTokens = sandbox.stub(identityDB, 'countAllInvalidNonUserTokens').resolves(0)
  const countAllInvalidUserTokens = sandbox.stub(identityDB, 'countAllInvalidUserTokens').resolves(0)
  const countAllValidUserTokens = sandbox.stub(identityDB, 'countAllValidUserTokens').resolves(0)
  const deleteInvalidTokens = sandbox.stub(identityDB, 'deleteInvalidNonUserTokens').resolves(undefined)
  const deleteValidTokens = sandbox.stub(identityDB, 'deleteInvalidUserTokens').resolves(undefined)
  it('should delete invalid tokens', async () => {
    countAllValidUserTokens.resolves(0)
    countAllInvalidNonUserTokens.resolves(1)
    countAllInvalidUserTokens.resolves(1)
    const result = await clearRedundantTokensJob.execute()
    sandbox.assert.calledWith(deleteInvalidTokens, 2)
    expect(result.text).to.eq('Deleted 2 invalid tokens and 0 valid tokens')
  })
  it('should delete valid tokens', async () => {
    countAllValidUserTokens.resolves(1)
    countAllInvalidNonUserTokens.resolves(0)
    countAllInvalidUserTokens.resolves(0)
    const result = await clearRedundantTokensJob.execute()
    sandbox.assert.calledWith(deleteValidTokens, 1)
    expect(result.text).to.eq('Deleted 0 invalid tokens and 1 valid tokens')
  })
  it('shouldnt delete any tokens if the counts are 0', async () => {
    countAllValidUserTokens.resolves(0)
    countAllInvalidNonUserTokens.resolves(0)
    countAllInvalidUserTokens.resolves(0)
    const result = await clearRedundantTokensJob.execute()
    sandbox.assert.notCalled(deleteValidTokens)
    sandbox.assert.notCalled(deleteInvalidTokens)
    expect(result.text).to.eq('Deleted 0 invalid tokens and 0 valid tokens')
  })
})
