import * as path from 'path'
import * as dotenv from 'dotenv'
import logNode = require('log-node')
import { NOTIFICATION_LEVEL } from './service/notification/NotificationLevel'
dotenv.config()
logNode()
const env = process.env

const config = {
  database: {
    server: env.DATABASE_SERVER,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    enableDebugLogs: JSON.parse(env.DATABASE_ENABLE_DEBUG ?? 'false') as boolean,
    sslCertificate: env.SSL_CERT ?? path.resolve(__dirname, 'resources', 'DigiCertGlobalRootG2.crt.pem')
  },
  jobs: {
    redundantTokens: {
      cron: env.REDUNDANT_TOKEN_CRON ?? '0 0 1 * * 0',
      runOnStartup: JSON.parse(env.REDUNDANT_TOKEN_RUN_ON_STARTUP ?? 'false') as boolean,
      deleteBatchSize: parseInt(env.DELETE_TOKEN_BATCH_SIZE ?? '1000')
    },
    duplicateTokens: {
      cron: env.DUPLICATE_TOKEN_CRON ?? '0 */15 * * * *',
      runOnStartup: JSON.parse(env.DUPLICATE_TOKEN_RUN_ON_STARTUP ?? 'false') as boolean
    },
    courseCompletions: {
      cron: env.COURSE_COMPLETIONS_CRON ?? '0 5 0 * * SUN',
      defaultFallbackPeriod: env.COURSE_COMPLETIONS_FALLBACK_DURATION ?? 'P1W',
      notifyTemplate: env.NOTIFY_COURSE_COMPLETION_TEMPLATE ?? '',
      notifyPasswordTemplate: env.NOTIFY_COURSE_COMPLETION_PASSWORD_TEMPLATE ?? '',
      emailRecipients: (env.NOTIFY_COURSE_COMPLETION_RECIPIENTS ?? '').split(',')
    }
  },
  notifications: {
    notificationLevel: NOTIFICATION_LEVEL[env.GLOBAL_NOTIFICATION_LEVEL ?? NOTIFICATION_LEVEL.ERROR] as NOTIFICATION_LEVEL,
    slack: {
      apiToken: env.SLACK_API_TOKEN,
      alertChannelId: env.SLACK_CHANNEL_NOTIFICATION_ID
    },
    govNotify: {
      apiKey: env.GOVUK_NOTIFY_API_KEY
    }
  },
  azure: {
    storage: {
      accountConnectionString: env.WEBSITE_CONTENTAZUREFILECONNECTIONSTRING ?? 'AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;DefaultEndpointsProtocol=http;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;',
      table: {
        tableName: env.AZURE_TABLE_STORAGE_TABLENAME ?? 'jobData'
      },
      blob: {
        defaultDaysToKeepDownloadLinksActive: parseInt(env.AZURE_BLOB_DAYS_TO_KEEP_LINKS_ACTIVE ?? '7')
      }
    }
  }
}

export default config
