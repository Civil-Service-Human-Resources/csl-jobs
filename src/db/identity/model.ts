import { type RowDataPacket } from 'mysql2'

export interface IPartialToken extends RowDataPacket {
  authentication_id: string
  client_id: string
}
