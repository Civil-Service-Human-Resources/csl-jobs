import { type Connection, createConnection, type RowDataPacket } from 'mysql2/promise'
import config from '../config'
import * as fs from 'fs'
import log from 'log'

const { database: { server, username, password, enableDebugLogs, sslCertificate } } = config

export const getConn = async (database?: string): Promise<Connection> => {
  return await createConnection({
    database,
    host: server,
    user: username,
    password,
    debug: enableDebugLogs,
    ssl: {
      cert: fs.readFileSync(sslCertificate).toString()
    }
  })
}

export const executeUpdate = async (SQL: string, database?: string): Promise<void> => {
  const conn = await getConn(database)
  await conn.execute(SQL)
}

export const fetchCount = async (SQL: string, database?: string, countCol: string = 'count(*)'): Promise<number> => {
  const connection = await getConn(database)
  const res = await connection.query(SQL)
  return parseInt(res[0][0][countCol])
}

export const fetchRows = async <T extends RowDataPacket> (SQL: string, database?: string): Promise<T[]> => {
  const connection = await getConn(database)
  log.debug(`Running SQL query: ${SQL}`)
  const rows: T[] = (await connection.query<T[]>(SQL))[0] ?? []
  log.debug(`Found ${rows.length} rows`)
  return rows
}
