import type { RowDataPacket } from 'mysql2'

export interface IOrganisationDomain extends RowDataPacket {
  domain: string
  organisation_name: string
  usages: number
  last_logged_in: Date
}
