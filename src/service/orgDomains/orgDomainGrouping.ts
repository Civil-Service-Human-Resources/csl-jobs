import { IDomain } from "./model/IDomain"
import { IOrganisationDomain } from "./model/IOrganisationDomain"

export const groupOrganisationsByDomain = (domains: IDomain[], organisationDomains: IOrganisationDomain[]) => {
    domains.map((domain) => {
        let organisationsForDomain = organisationDomains.filter((organisationDomainPair) => organisationDomainPair.domain === domain.domain)
        domain.organisations = organisationsForDomain
        return domain
    })
  
    return domains
}