import { type Connection, createConnection } from 'mysql2/promise'
import {
  DATABASE_SERVER,
  DATABASE_PASSWORD,
  DATABASE_USER,
  DATABASE_ENABLE_DEBUG,
  SSL_CERT
} from '../config'
import * as fs from 'fs'

export const getConn = async (database: string): Promise<Connection> => {
  return await createConnection({
    database,
    host: DATABASE_SERVER,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    debug: DATABASE_ENABLE_DEBUG,
    ssl: {
      cert: fs.readFileSync(SSL_CERT).toString()
    }
  })
}
