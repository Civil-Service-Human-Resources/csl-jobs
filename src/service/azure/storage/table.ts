import { TableClient, TableServiceClient } from '@azure/data-tables'
import config from '../../../config'
import log from 'log'

const { azure: { storage } } = config

const getTableClient = async (tableName: string): Promise<TableClient> => {
  log.debug('Creating table service client')
  const tableService = TableServiceClient.fromConnectionString(storage.accountConnectionString)
  log.debug(`Creating table '${tableName}'`)
  await tableService.createTable(tableName, {
    requestOptions: {
      allowInsecureConnection: true
    }
  })
  log.debug(`Creating client for table '${tableName}'`)
  return TableClient.fromConnectionString(storage.accountConnectionString, storage.table.tableName, {
    allowInsecureConnection: true
  })
}

const upsertValueInTable = async (tableName: string, partitionKey: string, rowKey: string, value: string): Promise<void> => {
  log.debug(`Upserting value '${rowKey}' to '${value}' in  partition '${partitionKey}' in table '${tableName}'`)
  const client = await getTableClient(tableName)
  await client.upsertEntity({
    partitionKey,
    rowKey,
    value
  }, 'Replace')
}

const getValueFromTable = async (tableName: string, partitionKey: string, rowKey: string): Promise<string | undefined> => {
  try {
    const client = await getTableClient(tableName)
    log.debug(`Fetching value: '${rowKey}' in partition: '${partitionKey}' from table '${tableName}'`)
    const result = await client.getEntity(partitionKey, rowKey)
    return result.value as string
  } catch (e) {
    const statusCode = e.statusCode as number
    log.warn(`Error code ${statusCode} encountered when fetching data`)
  }
}

export const getJobData = async (partitionKey: string, rowKey: string): Promise<string | undefined> => {
  return await getValueFromTable('jobData', partitionKey, rowKey)
}

export const upsertJobData = async (partitionKey: string, rowKey: string, value: string): Promise<void> => {
  await upsertValueInTable('jobData', partitionKey, rowKey, value)
}
