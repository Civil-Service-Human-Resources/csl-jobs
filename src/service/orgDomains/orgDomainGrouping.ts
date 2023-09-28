import type { IDomain } from './model/IDomain'
import type { IOrganisationDomain } from './model/IOrganisationDomain'

export const groupOrganisationsByDomain = (domains: IDomain[], organisationDomains: IOrganisationDomain[]): IDomain[] => {
  domains.map((domain) => {
    const organisationsForDomain = organisationDomains.filter((organisationDomainPair) => organisationDomainPair.domain === domain.domain)
    domain.organisations = organisationsForDomain
    return domain
  })
  return domains
}
