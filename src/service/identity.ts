import * as identityDB from '../db/identity/database'
import log = require('log')
import { runJob } from './job/jobService'

export const clearDuplicateTokens = async (): Promise<void> => {
  await runJob({
    name: 'Clear duplicate tokens',
    jobFunc: async () => {
      const duplicates = await identityDB.getDuplicateTokens()
      if (duplicates.length > 0) {
        log.info(`Found ${duplicates.length} duplicate tokens`)
        const duplicateIds = duplicates.map(d => d.authentication_id)
        log.info(`deleting duplicates '${duplicateIds.join(',')}'`)
        await identityDB.deactivateTokens(duplicateIds)
      } else {
        log.info('0 duplicate tokens found')
      }
      return {
        text: `Deactivated ${duplicates.length} duplicate tokens`
      }
    }
  })
}

export const clearRedundantTokens = async (): Promise<void> => {
  await runJob({
    name: 'Clear redundant tokens',
    jobFunc: async () => {
      const allTokens = await identityDB.countAllTokens()
      log.info(`Total tokens: ${allTokens}`)

      const validNonUserTokens = await identityDB.countAllValidNonUserTokens()
      log.info(`Total valid non-user tokens: ${validNonUserTokens}`)

      const invalidNonUserTokens = await identityDB.countAllInvalidNonUserTokens()
      log.info(`Total invalid non-user tokens: ${invalidNonUserTokens}`)

      const invalidUserTokens = await identityDB.countAllInvalidUserTokens()
      log.info(`Total invalid user tokens: ${invalidUserTokens}`)

      const validUserTokens = await identityDB.countAllValidUserTokens()
      log.info(`Total valid user tokens: ${validUserTokens}`)

      const totalInvalidTokens = invalidNonUserTokens + invalidUserTokens
      log.info(`Total invalid tokens: ${totalInvalidTokens}`)
      if (totalInvalidTokens > 0) {
        log.info('Deleting invalid tokens')
        await identityDB.deleteInvalidTokens(totalInvalidTokens)
      }

      if (validUserTokens > 0) {
        log.info('Deleting valid user tokens')
        await identityDB.deleteValidTokens(validUserTokens)
      }
      return {
        text: `Deleted ${totalInvalidTokens} invalid tokens and ${validUserTokens} valid tokens`
      }
    }
  })
}
