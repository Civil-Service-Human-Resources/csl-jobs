import * as log4js from 'log4js'
import { LOGGING_LEVEL } from '../config'

const layout = {
  timestamp: '%d',
  level: '%p',
  message: '%m'
}

log4js.configure({
  appenders: { _default: { type: 'console', layout: { type: 'pattern', pattern: JSON.stringify(layout) } } },
  categories: { default: { appenders: ['_default'], level: LOGGING_LEVEL } }
})

export const logger = log4js.getLogger()
