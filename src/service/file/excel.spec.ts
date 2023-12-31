import { expect } from 'chai'
import { createExcelSpreadsheetfromOrgDomainData } from './excel'
import type { IDomain } from '../orgDomains/model/IDomain'
import type { IOrganisationDomain } from '../orgDomains/model/IOrganisationDomain'

class OrganisationDomain implements IOrganisationDomain {
  [column: number]: any
  [column: string]: any
  domain: string
  organisation_name: string
  usages: number
  last_logged_in: Date
  ['constructor']: { name: 'RowDataPacket' }
}

class Domain implements IDomain {
  [column: number]: any
  [column: string]: any
  domain: string
  organisations: IOrganisationDomain[]
  ['constructor']: { name: 'RowDataPacket' }
}

describe('Excel tests', () => {
  it('Should create headers at the top of the spreadsheet', async () => {
    const workbook = createExcelSpreadsheetfromOrgDomainData([])

    const worksheet = workbook.getWorksheet(1)

    expect(worksheet.getCell('A1').value).to.equal('Domain')
    expect(worksheet.getCell('B1').value).to.equal('Organisation')
    expect(worksheet.getCell('C1').value).to.equal('Usages')
    expect(worksheet.getCell('D1').value).to.equal('Last logged in')
  })

  it('Should place the data in the correct cells in the spreadsheet', async () => {
    const data: IDomain[] = getOrganisationDomainData()

    const workbook = createExcelSpreadsheetfromOrgDomainData(data)

    const worksheet = workbook.getWorksheet(1)

    expect(worksheet.getCell('A2').value).to.equal('test.gov.uk')
    expect(worksheet.getCell('A4').value).to.equal('secondtest.gov.uk')

    expect(worksheet.getCell('B2').value).to.equal('Cabinet Office')
    expect(worksheet.getCell('B3').value).to.equal('Office for National Statistics')
    expect(worksheet.getCell('B4').value).to.equal('Intellectual Property Office')
  })
})

const getOrganisationDomainData = (): IDomain[] => {
  const od1 = new OrganisationDomain()
  od1.domain = 'test.gov.uk'
  od1.organisation_name = 'Cabinet Office'
  od1.usages = 31
  od1.last_logged_in = new Date()

  const od2 = new OrganisationDomain()
  od2.domain = 'test.gov.uk'
  od2.organisation_name = 'Office for National Statistics'
  od2.usages = 43
  od2.last_logged_in = new Date()

  const domain1 = new Domain()
  domain1.domain = 'test.gov.uk'
  domain1.organisations = [od1, od2]

  const od3 = new OrganisationDomain()
  od3.domain = 'secondtest.gov.uk'
  od3.organisation_name = 'Intellectual Property Office'
  od3.usages = 14
  od3.last_logged_in = new Date()

  const domain2 = new Domain()
  domain2.domain = 'secondtest.gov.uk'
  domain2.organisations = [od3]

  const domains: Domain[] = [domain1, domain2]
  return domains
}
