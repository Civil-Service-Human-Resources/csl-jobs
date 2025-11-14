import { expect } from 'chai'
import { objsToCsv, objsToDelimited } from './delimited'

interface TestInt {
  emailAddress: string
  cei: string
  contentId: string
  timeSpent: number
}

async function verifyDelimitedOutput (generator: (objs: TestInt[]) => Promise<string>, delimiter: string): Promise<void> {
  const testObjs: TestInt[] = [
    { emailAddress: 'abc@xyz.com', cei: '', contentId: 'blue"colour', timeSpent: 1 },
    { emailAddress: 'a?bc@x-yz.com', cei: '', contentId: 'green/colour', timeSpent: 2 },
    { emailAddress: '-ab@x-y+z.com', cei: '', contentId: 'yellow\\colour', timeSpent: 3 },
    { emailAddress: '-ab@x-y+z.com', cei: '', contentId: 'redcolour', timeSpent: 4 },
    { emailAddress: '-ab@x-y+z.com', cei: '', contentId: 'grey colour', timeSpent: 5 }
  ]

  const result = await generator(testObjs)
  const rows = result.split('\n')
  const headers = rows[0].split(delimiter)

  // Header checks
  expect(headers).to.deep.equal(['emailAddress', 'cei', 'contentId', 'timeSpent'])

  // First row checks
  const firstRow = rows[1].split(delimiter)
  expect(firstRow).to.deep.equal(['abc@xyz.com', '', '"blue""colour"', '1'])

  // Second row checks
  const secondRow = rows[2].split(delimiter)
  expect(secondRow).to.deep.equal(['a?bc@x-yz.com', '', 'green/colour', '2'])

  // Third row checks
  const thirdRow = rows[3].split(delimiter)
  expect(thirdRow).to.deep.equal(['-ab@x-y+z.com', '', 'yellow\\colour', '3'])

  // Fourth row checks
  const fourthRow = rows[4].split(delimiter)
  expect(fourthRow).to.deep.equal(['-ab@x-y+z.com', '', 'redcolour', '4'])

  // Fifth row checks
  const fifthRow = rows[5].split(delimiter)
  expect(fifthRow).to.deep.equal(['-ab@x-y+z.com', '', 'grey colour', '5'])
}

// CSV Tests
describe('CSV tests', () => {
  it('Should create a comma-delimited string from a list of objects', async () => {
    await verifyDelimitedOutput(objsToCsv, ',')
  })
})

// PSV Tests
describe('PSV tests', () => {
  it('Should create a pipe-delimited string from a list of objects', async () => {
    await verifyDelimitedOutput(async (objs) => await objsToDelimited(objs, '|'), '|')
  })
})
