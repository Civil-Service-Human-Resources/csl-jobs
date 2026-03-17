import { TableService } from '../../src/service/azure/storage/table/service'
import { getTableClient } from '../../src/service/azure/storage/table/connection'

export class TestTableService extends TableService {
  constructor (partition: string) {
    super('testJobData', partition)
  }

  teardown = async (): Promise<void> => {
    console.log('Tearing table data down')
    const client = await getTableClient('testJobData')
    await client.deleteTable()
  }
}
