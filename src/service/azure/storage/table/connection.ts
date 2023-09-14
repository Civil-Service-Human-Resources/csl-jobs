import { TableClient } from '@azure/data-tables'
import log from 'log'
import config from '../../../../config'

const { azure: { storage } } = config

export const getTableClient = async (tableName: string): Promise<TableClient> => {
  log.debug('Creating table service client')
  const tableClient = TableClient.fromConnectionString(storage.accountConnectionString, storage.table.tableName, {
    allowInsecureConnection: true
  })
  log.debug(`Creating table '${tableName}' if it doesn't exist`)
  await tableClient.createTable()
  return tableClient
}
