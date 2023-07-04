import * as identityDB from '../db/identity/database'
import { logger } from '../middleware/logging'
import { runJob } from './job/jobService'

export const clearDuplicateTokens = async (): Promise<void> => {
  await runJob({
    name: 'Clear duplicate tokens',
    jobFunc: async () => {
      const duplicates = await identityDB.getDuplicateTokens()
      logger.info(duplicates)
      for (const duplicate of duplicates) {
        logger.info(`deleting dupliate '${duplicate.authentication_id}'`)
        await identityDB.deactivateToken(duplicate.authentication_id)
      }
    }
  })
}

export const clearRedundantTokens = async (): Promise<void> => {
  await runJob({
    name: 'Clear redundant tokens',
    jobFunc: async () => {
      const allTokens = await identityDB.countAllTokens()
      logger.info(`Total tokens: ${allTokens}`)

      const validNonUserTokens = await identityDB.countAllValidNonUserTokens()
      logger.info(`Total valid non-user tokens: ${validNonUserTokens}`)

      const invalidNonUserTokens = await identityDB.countAllInvalidNonUserTokens()
      logger.info(`Total invalid non-user tokens: ${invalidNonUserTokens}`)

      const invalidUserTokens = await identityDB.countAllInvalidUserTokens()
      logger.info(`Total invalid user tokens: ${invalidUserTokens}`)

      const validUserTokens = await identityDB.countAllValidUserTokens()
      logger.info(`Total valid user tokens: ${validUserTokens}`)

      const totalInvalidTokens = invalidNonUserTokens + invalidUserTokens
      logger.info(`Total invalid tokens: ${totalInvalidTokens}`)
      if (totalInvalidTokens > 0) {
        logger.info('Deleting invalid tokens')
        await identityDB.deleteInvalidTokens(totalInvalidTokens)
      }

      if (validUserTokens > 0) {
        logger.info('Deleting valid user tokens')
        await identityDB.deleteValidTokens(validUserTokens)
      }
    }
  })
}
