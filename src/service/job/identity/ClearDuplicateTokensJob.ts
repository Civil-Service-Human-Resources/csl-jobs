import { Job } from '../Job'
import log = require('log')
import { type JobResult } from '../jobService'
import * as identityDB from '../../../db/identity/database'

export class ClearDuplicateTokensJob extends Job {
  protected async runJob (): Promise<JobResult> {
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

  public getName (): string {
    return 'Clear duplicate tokens'
  }
}
