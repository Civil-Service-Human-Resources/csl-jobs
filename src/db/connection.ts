import { type Connection, createConnection, type RowDataPacket } from 'mysql2/promise'
import config from '../config'
import log from 'log'
import * as fs from 'node:fs'

const {
  database: {
    server,
    username,
    password,
    enableDebugLogs,
    sslCertificate,
    useSSL
  }
} = config

export const getConn = async (database?: string): Promise<Connection> => {
  let config = {
    database,
    host: server,
    user: username,
    password,
    debug: enableDebugLogs
  }
  if (useSSL) {
    config = {
      ...config,
      ...{
        ssl: {
          cert: fs.readFileSync(sslCertificate).toString()
        }
      }
    }
  }
  return await createConnection(config)
}

export const executeUpdate = async (SQL: string, vars: any[], database?: string): Promise<void> => {
  const conn = await getConn(database)
  await conn.execute(SQL, vars)
}

export const fetchCount = async (SQL: string, vars: any[], database?: string): Promise<number> => {
  const connection = await getConn(database)
  const res = await connection.query(SQL, vars)
  const countCol = res[1][0].name
  return parseInt(res[0][0][countCol])
}

export const fetchRows = async <T extends RowDataPacket>(SQL: string, vars: any[], database?: string): Promise<T[]> => {
  const connection = await getConn(database)
  log.debug(`Running SQL query: ${SQL} with vars [${vars.join(',')}]`)
  const rows: T[] = (await connection.query<T[]>(SQL, vars))[0] ?? []
  log.debug(`Found ${rows.length} rows`)
  return rows
}
