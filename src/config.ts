import * as path from 'path'
import * as dotenv from 'dotenv'
import { NOTIFICATION_LEVEL } from './service/notification/NotificationLevel'
import logNode = require('log-node')

dotenv.config({
  path: path.join(__dirname, '/.env')
})
logNode()
const env = process.env

const config = {
  database: {
    server: env.DATABASE_SERVER ?? 'localhost',
    username: env.DATABASE_USER ?? 'root',
    password: env.DATABASE_PASSWORD ?? 'my-secret-pw',
    enableDebugLogs: JSON.parse(env.DATABASE_ENABLE_DEBUG ?? 'false') as boolean,
    useSSL: JSON.parse(env.DATABASE_USE_SSL ?? 'true') as boolean,
    sslCertificate: env.SSL_CERT ?? path.join(__dirname, 'resources', 'DigiCertGlobalRootG2.crt.pem')
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
    },
    skillsCompletedLearnerRecords: {
      cron: env.SKILLS_SYNC_CRON ?? '0 2 0 * * *',
      defaultFallbackPeriod: env.SKILLS_SYNC_FALLBACK_DURATION ?? 'P1D',
      runOnStartup: JSON.parse(env.SKILLS_SYNC_RUN_ON_STARTUP ?? 'false') as boolean,
      csvFilenamePrefix: env.SKILLS_SYNC_CSV_FILENAME_PREFIX ?? 'skills_completed_lr'
    },
    orgDomains: {
      cron: env.ORG_DOMAINS_CRON ?? '0 0 22 * * SUN',
      notifyTemplate: env.ORG_DOMAINS_EMAIL_TEMPLATE ?? '',
      passwordNotifyTemplate: env.ORG_DOMAINS_PASSWORD_EMAIL_TEMPLATE ?? '',
      emailRecipients: (env.ORG_DOMAINS_EMAIL_RECIPIENTS ?? '').split(',')
    },
    obtStats: {
      cron: env.OBT_STATS_CRON ?? '0 0 0 * * *',
      defaultFallbackPeriod: env.OBT_STATS_FALLBACK_DURATION ?? 'P1D',
      bucketAlias: env.OBT_S3_BUCKET_ALIAS ?? '',
      keySubfolder: env.OBT_S3_SUBFOLDER ?? 'onebigthing',
      courseIds: (env.OBT_COURSE_IDS ?? '').split(',')
    }
  },
  notifications: {
    notificationLevel: NOTIFICATION_LEVEL[env.GLOBAL_NOTIFICATION_LEVEL ?? 'ERROR'] as NOTIFICATION_LEVEL,
    slack: {
      apiToken: env.SLACK_API_TOKEN,
      alertChannelId: env.SLACK_CHANNEL_NOTIFICATION_ID
    },
    govNotify: {
      apiKey: env.GOVUK_NOTIFY_API_KEY
    }
  },
  app: {
    defaultTimezone: env.SERVER_DEFAULT_TZ ?? 'UTC'
  },
  aws: {
    storage: {
      accessKey: env.AWS_S3_ACCESS_KEY ?? '',
      secretKey: env.AWS_S3_SECRET_KEY ?? ''
    }
  },
  azure: {
    siteName: env.WEBSITE_SITE_NAME ?? 'csl-jobs-local',
    storage: {
      accountConnectionString: env.WEBSITE_CONTENTAZUREFILECONNECTIONSTRING ?? 'AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;DefaultEndpointsProtocol=http;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;',
      table: {
        tableName: env.AZURE_TABLE_STORAGE_TABLENAME ?? 'jobData'
      },
      blob: {
        defaultDaysToKeepDownloadLinksActive: parseInt(env.AZURE_BLOB_DAYS_TO_KEEP_LINKS_ACTIVE ?? '7')
      }
    }
  },
  sftp: {
    skillsSftpHost: env.SKILLS_SYNC_SFTP_HOST ?? 'localhost',
    skillsSftpPort: parseInt(env.SKILLS_SYNC_SFTP_PORT ?? '2222'),
    skillsSftpUsername: env.SKILLS_SYNC_SFTP_USERNAME ?? 'foo',
    skillsSftpRemoteDir: env.SKILLS_SYNC_SFTP_REMOTE_DIR ?? '/upload'
  }
}

process.env.TZ = config.app.defaultTimezone

export default config
