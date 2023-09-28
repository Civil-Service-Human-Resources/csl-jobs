import { expect } from "chai"
import { IDomain } from "./model/IDomain"
import { IOrganisationDomain } from "./model/IOrganisationDomain"
import { groupOrganisationsByDomain } from "./orgDomainGrouping"

class OrganisationDomain implements IOrganisationDomain{
    [column: number]: any
    [column: string]: any
    domain: string
    organisation_name: string
    usages: number
    last_logged_in: Date
    ["constructor"]: { name: "RowDataPacket" }
}

class Domain implements IDomain{
    [column: number]: any
    [column: string]: any
    domain: string
    organisations: IOrganisationDomain[]
    ["constructor"]: { name: "RowDataPacket" }
}

describe("Organisation domain grouping", () => {
    it("Should group organisations by domains", () => {
        let od1 = new OrganisationDomain()
        od1.domain = "test1.gov.uk"
        od1.organisation_name = "Org1"
        od1.usages = 30
        od1.last_logged_in = new Date()
    
        let od2 = new OrganisationDomain()
        od2.domain = "test1.gov.uk"
        od2.organisation_name = "Org2"
        od2.usages = 40
        od2.last_logged_in = new Date()
    
        let od3 = new OrganisationDomain()
        od3.domain = "test2.gov.uk"
        od3.organisation_name = "Org3"
        od3.usages = 56
        od3.last_logged_in = new Date()
    
        let od4 = new OrganisationDomain()
        od4.domain = "test2.gov.uk"
        od4.organisation_name = "Org4"
        od4.usages = 34
        od4.last_logged_in = new Date()
    
        let domain1 = new Domain()
        domain1.domain = "test1.gov.uk"
    
        let domain2 = new Domain()
        domain2.domain = "test2.gov.uk"

        let domains: Domain[] = [domain1, domain2]
        let organisationDomains: OrganisationDomain[] = [od1, od2, od3, od4]
    
        let groupedOrganisations = groupOrganisationsByDomain(domains, organisationDomains)        
    
        expect(groupedOrganisations[0].domain).to.equal("test1.gov.uk")
        expect(groupedOrganisations[0].organisations.length).to.equal(2)
        expect(groupedOrganisations[0].organisations[0].organisation_name).to.equal("Org1")
        expect(groupedOrganisations[0].organisations[1].organisation_name).to.equal("Org2")
    
        expect(groupedOrganisations[1].domain).to.equal("test2.gov.uk")
        expect(groupedOrganisations[1].organisations.length).to.equal(2)
        expect(groupedOrganisations[1].organisations[0].organisation_name).to.equal("Org3")
        expect(groupedOrganisations[1].organisations[1].organisation_name).to.equal("Org4")
    })
    
})