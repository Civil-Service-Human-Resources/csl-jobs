import { Validatable } from '../../../util/objectUtils'
import { IsIn } from 'class-validator'

const LOGGING_LEVELS = ['INFO', 'DEBUG', 'TRACE', 'ERROR', 'WARN']
export type LoggingLevels = typeof LOGGING_LEVELS[number]

export class SetTestEnvLoggingLevelsJobArgs extends Validatable {
  @IsIn(LOGGING_LEVELS, {
    message: 'Log level must be one of ' + LOGGING_LEVELS.join(', ')
  })
  public loggingLevel: LoggingLevels

  constructor (loggingLevel: LoggingLevels) {
    super()
    this.loggingLevel = loggingLevel
  }
}
