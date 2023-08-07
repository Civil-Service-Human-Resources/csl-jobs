import * as identityDB from '../../../db/identity/database'
import log = require('log')
import { Job } from '../Job'
import { type JobResult } from '../jobService'

export class ClearRedundantTokensJob extends Job {
  protected async runJob (): Promise<JobResult> {
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

  public getName (): string {
    return 'Clear redundant tokens'
  }
}
