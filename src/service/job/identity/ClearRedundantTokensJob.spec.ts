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
    deleteInvalidNonUserTokens.reset()
    deleteInvalidUserTokens.reset()
  })
  sandbox.stub(identityDB, 'countAllTokens').resolves(0)
  sandbox.stub(identityDB, 'countAllValidNonUserTokens').resolves(0)
  const countAllInvalidNonUserTokens = sandbox.stub(identityDB, 'countAllInvalidNonUserTokens').resolves(0)
  const countAllInvalidUserTokens = sandbox.stub(identityDB, 'countAllInvalidUserTokens').resolves(0)
  const deleteInvalidNonUserTokens = sandbox.stub(identityDB, 'deleteInvalidNonUserTokens').resolves(undefined)
  const deleteInvalidUserTokens = sandbox.stub(identityDB, 'deleteInvalidUserTokens').resolves(undefined)
  it('should delete non-user invalid tokens', async () => {
    countAllInvalidNonUserTokens.resolves(2)
    countAllInvalidUserTokens.resolves(0)
    const result = await clearRedundantTokensJob.execute()
    sandbox.assert.calledWith(deleteInvalidNonUserTokens, 2)
    expect(result.text).to.eq('Deleted 2 invalid non-user tokens and 0 invalid user tokens')
  })
  it('should delete user invalid tokens', async () => {
    countAllInvalidNonUserTokens.resolves(0)
    countAllInvalidUserTokens.resolves(1)
    const result = await clearRedundantTokensJob.execute()
    sandbox.assert.calledWith(deleteInvalidUserTokens, 1)
    expect(result.text).to.eq('Deleted 0 invalid non-user tokens and 1 invalid user tokens')
  })
  it('shouldnt delete any tokens if the counts are 0', async () => {
    countAllInvalidNonUserTokens.resolves(0)
    countAllInvalidUserTokens.resolves(0)
    const result = await clearRedundantTokensJob.execute()
    sandbox.assert.notCalled(deleteInvalidNonUserTokens)
    sandbox.assert.notCalled(deleteInvalidUserTokens)
    expect(result.text).to.eq('Deleted 0 invalid non-user tokens and 0 invalid user tokens')
  })
})
