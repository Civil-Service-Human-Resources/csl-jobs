import { expect } from 'chai'
import { objsToCsv } from './csv'

interface TestInt {
  shape: string
  colour: string
  size: number
}

describe('CSV tests', () => {
  it('Should create a csv from a list of objects', async () => {
    const testObjs: TestInt[] = [
      { shape: 'square', colour: 'blue', size: 1 },
      { shape: 'circle', colour: 'green', size: 3 },
      { shape: 'triangle', colour: 'yellow', size: 6 }
    ]
    const result = await objsToCsv(testObjs)
    const rows = result.split('\n')
    const headers = rows[0].split(',')
    expect(headers[0]).to.equal('shape')
    expect(headers[1]).to.equal('colour')
    expect(headers[2]).to.equal('size')

    const firstRow = rows[1].split(',')
    expect(firstRow[0]).to.equal('square')
    expect(firstRow[1]).to.equal('blue')
    expect(firstRow[2]).to.equal('1')

    const secondRow = rows[2].split(',')
    expect(secondRow[0]).to.equal('circle')
    expect(secondRow[1]).to.equal('green')
    expect(secondRow[2]).to.equal('3')

    const thirdRow = rows[3].split(',')
    expect(thirdRow[0]).to.equal('triangle')
    expect(thirdRow[1]).to.equal('yellow')
    expect(thirdRow[2]).to.equal('6')
  })
})
