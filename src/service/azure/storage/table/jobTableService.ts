import { TableService } from './service'
import config from '../../../../config'

const { azure: { storage: { table: { tableName } } } } = config

export class JobTableService extends TableService {
  constructor (partition: string) {
    super(tableName, partition)
  }
}
