import * as identityDB from '../db/identity/database'
import { assert } from 'chai'
import * as identityService from './identity'
import sinon = require('sinon')

describe('Identity servce tests', () => {
  const sandbox = sinon.createSandbox()
  describe('Test clear duplicates', () => {
    it('should delete duplicates if some have been found', async () => {
      const tokenRow: any = {
        authentication_id: 'auth_id',
        client_id: 'client_id'
      }
      const deact = sandbox.stub(identityDB, 'deactivateTokens')
      sandbox.stub(identityDB, 'getDuplicateTokens').resolves([tokenRow])
      await identityService.clearDuplicateTokens()
      assert.isTrue(deact.calledOnceWith(['auth_id']))
    })
  })
  describe('Test clear redundant tokens', () => {
    beforeEach(() => {
      deleteValidTokens.reset()
      deleteInvalidTokens.reset()
    })
    sandbox.stub(identityDB, 'countAllTokens').resolves(0)
    sandbox.stub(identityDB, 'countAllValidNonUserTokens').resolves(0)
    const countAllInvalidNonUserTokens = sandbox.stub(identityDB, 'countAllInvalidNonUserTokens').resolves(0)
    const countAllInvalidUserTokens = sandbox.stub(identityDB, 'countAllInvalidUserTokens').resolves(0)
    const countAllValidUserTokens = sandbox.stub(identityDB, 'countAllValidUserTokens').resolves(0)
    const deleteInvalidTokens = sandbox.stub(identityDB, 'deleteInvalidTokens').resolves(undefined)
    const deleteValidTokens = sandbox.stub(identityDB, 'deleteValidTokens').resolves(undefined)
    it('should delete invalid tokens', async () => {
      countAllInvalidNonUserTokens.resolves(1)
      countAllInvalidUserTokens.resolves(1)
      await identityService.clearRedundantTokens()
      assert.isTrue(deleteInvalidTokens.calledOnceWith(2))
    })
    it('should delete valid tokens', async () => {
      countAllValidUserTokens.resolves(1)
      await identityService.clearRedundantTokens()
      assert.isTrue(deleteValidTokens.calledOnceWith(1))
    })
    it('shouldnt delete any tokens if the counts are 0', async () => {
      countAllValidUserTokens.resolves(0)
      countAllInvalidNonUserTokens.resolves(0)
      countAllInvalidUserTokens.resolves(0)
      await identityService.clearRedundantTokens()
      assert.isTrue(deleteValidTokens.notCalled)
      assert.isTrue(deleteInvalidTokens.notCalled)
    })
  })
})
