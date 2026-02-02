import log from 'log'
import { CustomDate } from '../../../date/CustomDate'
import { getTableClient } from './connection'

export class TableService {
  constructor (private readonly tableName: string, private readonly _partition: string) {}

  get partition (): string {
    return this._partition
  }

  deleteValueInTable = async (rowKey: string): Promise<void> => {
    log.debug(`Deleting value '${rowKey}' in  partition '${this._partition}' in table '${this.tableName}'`)
    const client = await getTableClient(this.tableName)
    await client.deleteEntity(this._partition, rowKey)
  }

  upsertValueInTable = async (rowKey: string, value: string): Promise<void> => {
    log.debug(`Upserting value '${rowKey}' to '${value}' in  partition '${this._partition}' in table '${this.tableName}'`)
    const client = await getTableClient(this.tableName)
    await client.upsertEntity({
      partitionKey: this._partition,
      rowKey,
      value
    }, 'Replace')
  }

  getNumberFromTable = async (rowKey: string): Promise<number | undefined> => {
    const value = await this.getValueFromTable(rowKey)
    return value === undefined ? undefined : parseInt(value)
  }

  getListFromTable = async (rowKey: string, delimiter: string = ','): Promise<string[] | undefined> => {
    const value = await this.getValueFromTable(rowKey)
    return value === undefined ? undefined : value.split(delimiter)
  }

  getValueFromTable = async (rowKey: string): Promise<string | undefined> => {
    try {
      const client = await getTableClient(this.tableName)
      log.debug(`Fetching value: '${rowKey}' in partition: '${this._partition}' from table '${this.tableName}'`)
      const result = await client.getEntity(this._partition, rowKey)
      return result.value as string
    } catch (e) {
      const statusCode = e.statusCode as number
      log.warn(`Error code ${statusCode} encountered when fetching data`)
    }
  }

  getDateFromTable = async (rowKey: string): Promise<CustomDate | undefined> => {
    log.info('Getting timestamp')
    const timestamp = await this.getValueFromTable(rowKey)
    if (timestamp !== undefined) {
      const date = new CustomDate(timestamp)
      date.fixOffset()
      log.info(`Timestamp is ${date.toISOString()}`)
      return date
    }
    return undefined
  }
}

/**
 * @deprecated use the class instead
 */
const upsertValueInTable = async (tableName: string, partitionKey: string, rowKey: string, value: string): Promise<void> => {
  log.debug(`Upserting value '${rowKey}' to '${value}' in  partition '${partitionKey}' in table '${tableName}'`)
  const client = await getTableClient(tableName)
  await client.upsertEntity({
    partitionKey,
    rowKey,
    value
  }, 'Replace')
}

/**
 * @deprecated use the class instead
 */
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

/**
 * @deprecated use the class instead
 */
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

/**
 * @deprecated use the class instead
 */
export const getJobData = async (partitionKey: string, rowKey: string): Promise<string | undefined> => {
  return await getValueFromTable('jobData', partitionKey, rowKey)
}

/**
 * @deprecated use the class instead
 */
export const upsertJobData = async (partitionKey: string, rowKey: string, value: string): Promise<void> => {
  await upsertValueInTable('jobData', partitionKey, rowKey, value)
}
