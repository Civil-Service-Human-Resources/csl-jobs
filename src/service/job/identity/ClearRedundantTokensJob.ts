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

    const validUserTokens = await identityDB.countAllValidUserTokens()
    log.info(`Total valid user tokens: ${validUserTokens}`)

    const totalValidTokens = validNonUserTokens + validUserTokens
    log.info(`Total valid tokens: ${totalValidTokens}`)

    const invalidNonUserTokens = await identityDB.countAllInvalidNonUserTokens()
    log.info(`Total invalid non-user tokens: ${invalidNonUserTokens}`)

    const invalidUserTokens = await identityDB.countAllInvalidUserTokens()
    log.info(`Total invalid user tokens: ${invalidUserTokens}`)

    const totalInvalidTokens = invalidNonUserTokens + invalidUserTokens
    log.info(`Total invalid tokens: ${totalInvalidTokens}`)

    if (invalidNonUserTokens > 0) {
      log.info('Deleting invalid non user tokens')
      await identityDB.deleteInvalidNonUserTokens(invalidNonUserTokens)
    }

    if (invalidUserTokens > 0) {
      log.info('Deleting invalid user tokens')
      await identityDB.deleteInvalidUserTokens(invalidUserTokens)
    }

    return {
      text: `Deleted ${invalidNonUserTokens} invalid non-user tokens and ${invalidUserTokens} invalid user tokens.
      Valid user tokens remaining: ${validUserTokens}. Valid non-user tokens remaining: ${validNonUserTokens}.`
    }
  }

  public getName (): string {
    return 'Clear redundant tokens'
  }
}
