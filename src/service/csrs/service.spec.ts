import sinon = require('sinon')
import { expect } from 'chai'
import * as database from '../../db/shared/database'
import {getOrganisationsWithFullNames} from "./service";

describe('Test csrsService', () => {
  const sandbox = sinon.createSandbox()
  const stubs: any = {}

  before(() => {
    stubs.sendCourseCompletionsNotification = sandbox.stub(database, 'getOrganisationsWithIds')
  })

  beforeEach(() => {
    sandbox.reset()
  })

  describe('Test getOrganisationsWithFullNames', () => {
    it('should append parent names to child organisations', async () => {
      const orgs: any[] = [
        { parent_id: null, name: 'Org 1', id: 1 },
        { parent_id: 1, name: 'Org 2', id: 2 },
        { parent_id: 2, name: 'Org 3', id: 3 },
        { parent_id: null, name: 'Org 4', id: 4 },
        { parent_id: 1, name: 'Org 5', id: 5 }
      ]
      stubs.sendCourseCompletionsNotification.resolves(orgs)
      const res = await getOrganisationsWithFullNames()
      expect(res.get(1)).to.eq('Org 1')
      expect(res.get(2)).to.eq('Org 1 | Org 2')
      expect(res.get(3)).to.eq('Org 1 | Org 2 | Org 3')
      expect(res.get(4)).to.eq('Org 4')
      expect(res.get(5)).to.eq('Org 1 | Org 5')
    })
  })
})
