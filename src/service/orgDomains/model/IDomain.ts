import type { RowDataPacket } from 'mysql2'
import type { IOrganisationDomain } from './IOrganisationDomain'

export interface IDomain extends RowDataPacket {
  domain: string
  organisations: IOrganisationDomain[]
}
