import Sinon from 'sinon'
import * as connection from './connection'
import { expect } from 'chai'
import { JobTableService } from './jobTableService'

describe('Azure table service tests', () => {
  const tableService = new JobTableService('testPartition')
  const sandbox = Sinon.createSandbox()
  const client: any = {}
  const getTableClient = sandbox.stub(connection, 'getTableClient').resolves(client)
  describe('Get jobData from table tests', () => {
    it('Should get jobData if it exists', async () => {
      client.getEntity = sandbox.stub().resolves({ value: 'result' })
      const res = await tableService.getValueFromTable('testRow')
      expect(res).to.eq('result')
      sandbox.assert.calledWith(client.getEntity, 'testPartition', 'testRow')
      sandbox.assert.calledWith(getTableClient, 'jobData')
    })
    it('Should undefined if jobData does not exist', async () => {
      client.getEntity = sandbox.stub().throws(new Error())
      const res = await tableService.getValueFromTable('testRow')
      expect(res).to.eq(undefined)
      sandbox.assert.calledWith(client.getEntity, 'testPartition', 'testRow')
      sandbox.assert.calledWith(getTableClient, 'jobData')
    })
  })

  describe('Upsert jobData to table tests', () => {
    it('Should upsert jobData', async () => {
      client.upsertEntity = sandbox.stub().resolves()
      await tableService.upsertValueInTable('testRow', 'value')
      sandbox.assert.calledWith(client.upsertEntity, {
        partitionKey: 'testPartition',
        rowKey: 'testRow',
        value: 'value'
      })
      sandbox.assert.calledWith(getTableClient, 'jobData')
    })
  })
})
