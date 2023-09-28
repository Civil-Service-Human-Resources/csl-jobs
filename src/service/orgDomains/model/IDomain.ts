import { RowDataPacket } from "mysql2";
import { IOrganisationDomain } from "./IOrganisationDomain";

export interface IDomain extends RowDataPacket{
    domain: string
    organisations: IOrganisationDomain[]
}