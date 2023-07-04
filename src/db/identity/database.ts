import { getConn } from '../connection'
import { DELETE_TOKEN_BATCH_SIZE } from '../../config'
import { type IPartialToken } from './model'
import { type Connection } from 'mysql2/promise'

const getConnection = async (): Promise<Connection> => {
  return await getConn('identity')
}

const ALL_TOKENS = 'select count(*) from token'
const ALL_VALID_NON_USER_TOKENS = 'select count(*) from token where status = 0 and user_name is null;'
const ALL_INVALID_NON_USER_TOKENS = 'select count(*) from token where status = 1 and user_name is null;'
const ALL_VALID_USER_TOKENS = 'select count(*) from token where status = 0 and user_name is not null;'
const ALL_INVALID_USER_TOKENS = 'select count(*) from token where status = 1 and user_name is not null;'

const DELETE_INVALID_TOKEN_SQL = `delete from token where status = 1 limit ${DELETE_TOKEN_BATCH_SIZE};`
const DELETE_VALID_USER_TOKEN_SQL = `delete from token where status = 0 and user_name is not null limit ${DELETE_TOKEN_BATCH_SIZE};`

const executeCount = async (sql: string): Promise<number> => {
  const connection = await getConnection()
  const res = await connection.query(sql)
  return parseInt(res[0][0]['count(*)'])
}

export const getDuplicateTokens = async (): Promise<IPartialToken[]> => {
  const connection = await getConnection()
  const rows = await connection.query<IPartialToken[]>(`SELECT authentication_id, client_id
FROM token
WHERE status COLLATE utf8_unicode_ci = 0
GROUP BY authentication_id
HAVING COUNT(*) > 1;`)[0]
  return rows ?? []
}

export const deactivateToken = async (authenticationId: string): Promise<void> => {
  const conn = await getConnection()
  const sql = `
UPDATE token
SET status = 1
WHERE authentication_id COLLATE utf8_unicode_ci = '${authenticationId}' AND status COLLATE utf8_unicode_ci = 0;`
  await conn.execute(sql)
}

const deleteTokens = async (sql: string, tokenCount: number): Promise<void> => {
  const conn = await getConnection()
  while (tokenCount > 0) {
    await conn.execute(sql)
    tokenCount = tokenCount - DELETE_TOKEN_BATCH_SIZE
  }
}

export const countAllTokens = async (): Promise<number> => {
  return await executeCount(ALL_TOKENS)
}

export const countAllValidNonUserTokens = async (): Promise<number> => {
  return await executeCount(ALL_VALID_NON_USER_TOKENS)
}

export const countAllInvalidNonUserTokens = async (): Promise<number> => {
  return await executeCount(ALL_INVALID_NON_USER_TOKENS)
}

export const countAllValidUserTokens = async (): Promise<number> => {
  return await executeCount(ALL_VALID_USER_TOKENS)
}

export const countAllInvalidUserTokens = async (): Promise<number> => {
  return await executeCount(ALL_INVALID_USER_TOKENS)
}

export const deleteInvalidTokens = async (count: number): Promise<void> => {
  await deleteTokens(DELETE_INVALID_TOKEN_SQL, count)
}

export const deleteValidTokens = async (count: number): Promise<void> => {
  await deleteTokens(DELETE_VALID_USER_TOKEN_SQL, count)
}
