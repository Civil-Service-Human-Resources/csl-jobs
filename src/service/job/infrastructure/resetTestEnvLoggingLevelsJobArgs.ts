import { Validatable } from '../../../util/objectUtils'

const LOGGING_LEVELS = ['INFO', 'DEBUG', 'TRACE', 'ERROR', 'WARN']
export type LoggingLevels = typeof LOGGING_LEVELS[number]

export class ResetTestEnvLoggingLevelsJobArgs extends Validatable {
  constructor (public readonly loggingLevel: LoggingLevels) {
    super()
  }
}
