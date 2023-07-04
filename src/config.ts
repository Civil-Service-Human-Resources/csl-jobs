import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config()
const env = process.env

export const DATABASE_SERVER = env.DATABASE_SERVER
export const DATABASE_USER = env.DATABASE_USER
export const DATABASE_PASSWORD = env.DATABASE_PASSWORD
export const DATABASE_ENABLE_DEBUG: boolean = JSON.parse(env.DATABASE_ENABLE_DEBUG ?? 'false')
export const SSL_CERT = env.SSL_CERT ?? path.resolve(__dirname, 'resources', 'DigiCertGlobalRootG2.crt.pem')

export const REDUNDANT_TOKEN_CRON = env.REDUNDANT_TOKEN_CRON ?? '0 1 * * 0'
export const DUPLICATE_TOKEN_CRON = env.DUPLICATE_TOKEN_CRON ?? '*/15 * * * *'
export const DELETE_TOKEN_BATCH_SIZE = parseInt(env.DELETE_TOKEN_BATCH_SIZE ?? '1000')

export const SLACK_API_TOKEN = env.SLACK_API_TOKEN
export const SLACK_CHANNEL_NOTIFICATION_ID = env.SLACK_CHANNEL_NOTIFICATION_ID

export const LOGGING_LEVEL = env.LOGGING_LEVEL ?? 'INFO'
