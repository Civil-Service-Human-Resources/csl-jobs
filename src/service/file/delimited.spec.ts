import { expect } from 'chai'
import { objsToCsv, objsToDelimited } from './delimited'

interface TestInt {
  emailAddress: string
  contentId: string
  timeSpent: number
}

describe('objsToDelimited with different delimiters', () => {
  const testObjs: TestInt[] = [
    { emailAddress: 'abc@xyz.com', contentId: 'blue"colour', timeSpent: 1 },
    { emailAddress: 'a?bc@x-yz.com', contentId: 'green/colour', timeSpent: 2 },
    { emailAddress: '-ab@x-y+z.com', contentId: 'yellow\\colour', timeSpent: 3 },
    { emailAddress: '-ab@x-y+z.com', contentId: 'redcolour', timeSpent: 4 },
    { emailAddress: '-ab@x-y+z.com', contentId: 'grey colour', timeSpent: 5 },
    { emailAddress: '-ab@x-y+z.com', contentId: 'comma,colour', timeSpent: 6 },
    { emailAddress: '-ab@x-y+z.com', contentId: 'pipe|colour', timeSpent: 7 }
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
      expect(lines[0]).to.equal(['emailAddress', 'contentId', 'timeSpent'].join(char))

      if (char === ',') {
        // Comma delimiter: delegated to objsToCsv
        const expectedCsv = await objsToCsv(testObjs)
        expect(result).to.equal(expectedCsv)
      } else if (char === '|') {
        // Pipe delimiter: quote only if value contains |, ", or newline
        expect(lines[1]).to.equal('abc@xyz.com|"blue""colour"|1')
        expect(lines[2]).to.equal('a?bc@x-yz.com|green/colour|2')
        expect(lines[3]).to.equal('-ab@x-y+z.com|yellow\\colour|3')
        expect(lines[4]).to.equal('-ab@x-y+z.com|redcolour|4')
        expect(lines[5]).to.equal('-ab@x-y+z.com|grey colour|5') // NO quotes
        expect(lines[6]).to.equal('-ab@x-y+z.com|comma,colour|6')
        expect(lines[7]).to.equal('-ab@x-y+z.com|"pipe|colour"|7') // quoted because contains |
      } else if (char === ' ') {
        // Space delimiter: quote if value contains space, ", or newline
        expect(lines[1]).to.equal('abc@xyz.com "blue""colour" 1')
        expect(lines[2]).to.equal('a?bc@x-yz.com green/colour 2')
        expect(lines[3]).to.equal('-ab@x-y+z.com yellow\\colour 3')
        expect(lines[4]).to.equal('-ab@x-y+z.com redcolour 4')
        expect(lines[5]).to.equal('-ab@x-y+z.com "grey colour" 5') // quoted because contains space
        expect(lines[6]).to.equal('-ab@x-y+z.com comma,colour 6')
        expect(lines[7]).to.equal('-ab@x-y+z.com pipe|colour 7') // no quotes
      }
    })
  })
})
