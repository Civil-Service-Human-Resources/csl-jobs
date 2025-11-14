import { expect } from 'chai'
import { objsToCsv, objsToDelimited } from './delimited'

interface TestInt {
  emailAddress: string
  cei: string
  contentId: string
  timeSpent: number
}

// Helper mirrors objsToDelimited quoting logic exactly
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const shouldQuote = (value: string, delimiter: string) => {
  return new RegExp(`[${delimiter}\n"]`).test(value)
}

// Helper to convert any value to the format used by objsToDelimited
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const formatValue = (val: any, delimiter: string) => {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') {
    val = val.replace(/"/g, '""')
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    if (shouldQuote(val, delimiter)) val = `"${val}"`
    return val
  }
  return String(val)
}

describe('objsToDelimited dynamic tests', () => {
  const testObjs: TestInt[] = [
    { emailAddress: 'abc@xyz.com', cei: '', contentId: 'blue"colour', timeSpent: 1 },
    { emailAddress: 'a?bc@x-yz.com', cei: '', contentId: 'green/colour', timeSpent: 2 },
    { emailAddress: '-ab@x-y+z.com', cei: '', contentId: 'yellow\\colour', timeSpent: 3 },
    { emailAddress: '-ab@x-y+z.com', cei: '', contentId: 'redcolour', timeSpent: 4 },
    { emailAddress: '-ab@x-y+z.com', cei: '', contentId: 'grey colour', timeSpent: 5 },
    { emailAddress: '-ab@x-y+z.com', cei: '', contentId: 'comma,colour', timeSpent: 6 },
    { emailAddress: '-ab@x-y+z.com', cei: '', contentId: 'pipe|colour', timeSpent: 7 }
  ]

  const delimiters: Array<{ char: string, name: string }> = [
    { char: ',', name: 'comma' },
    { char: '|', name: 'pipe' },
    { char: ' ', name: 'space' }
  ]

  delimiters.forEach(({ char, name }) => {
    // null value test
    it('should return empty string for null input', async () => {
      const result = await objsToDelimited(null as any, ',')
      expect(result).to.equal('')
    })

    // Empty value test
    it('should return empty string for empty array', async () => {
      const result = await objsToDelimited([], '|')
      expect(result).to.equal('')
    })

    // Delimiter tests
    it(`should return a properly formatted ${name}-delimited string`, async () => {
      const result = await objsToDelimited(testObjs, char)
      const lines = result.split('\n')

      // Header row
      expect(lines[0]).to.equal(Object.keys(testObjs[0]).join(char))

      if (char === ',') {
        // Comma uses objsToCsv internally
        const expectedCsv = await objsToCsv(testObjs)
        expect(result).to.equal(expectedCsv)
      } else {
        // Other delimiters: dynamically compute expected rows
        for (let i = 0; i < testObjs.length; i++) {
          const rowObj = testObjs[i]
          const expectedRow = Object.keys(rowObj)
            .map(key => formatValue(rowObj[key as keyof TestInt], char))
            .join(char)
          expect(lines[i + 1]).to.equal(expectedRow)
        }
      }
    })
  })
})
