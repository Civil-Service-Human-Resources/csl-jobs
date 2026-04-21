import { Validatable } from '../../../util/objectUtils'
import { IsIn } from 'class-validator'

const LOGGING_LEVELS = ['INFO', 'DEBUG', 'TRACE', 'ERROR', 'WARN']
export type LoggingLevels = typeof LOGGING_LEVELS[number]

export class ResetTestEnvLoggingLevelsJobArgs extends Validatable {
  @IsIn(LOGGING_LEVELS)
  public loggingLevel: LoggingLevels

  constructor (loggingLevel: LoggingLevels) {
    super()
    this.loggingLevel = loggingLevel
  }
}
