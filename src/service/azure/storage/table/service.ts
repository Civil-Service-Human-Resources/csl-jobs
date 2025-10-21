import log from 'log'
import { CustomDate } from '../../../date/CustomDate'
import { getTableClient } from './connection'

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

export const getDateFromTable = async (partitionKey: string, rowKey: string): Promise<CustomDate | undefined> => {
  log.info('Getting timestamp')
  const timestamp = await getJobData(partitionKey, rowKey)
  if (timestamp !== undefined) {
    const date = new CustomDate(timestamp)
    date.fixOffset()
    log.info(`Timestamp is ${date.toISOString()}`)
    return date
  }
  return undefined
}

export const getJobData = async (partitionKey: string, rowKey: string): Promise<string | undefined> => {
  return await getValueFromTable('jobData', partitionKey, rowKey)
}

export const upsertJobData = async (partitionKey: string, rowKey: string, value: string): Promise<void> => {
  await upsertValueInTable('jobData', partitionKey, rowKey, value)
}
