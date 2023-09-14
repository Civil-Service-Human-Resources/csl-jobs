import { executeUpdate, fetchCount, fetchRows } from '../connection'
import config from '../../config'
import { type IPartialToken } from './model'

const { jobs: { redundantTokens: { deleteBatchSize } } } = config

const ALL_TOKENS = 'select count(*) from token'
const ALL_VALID_NON_USER_TOKENS = 'select count(*) from token where status = 0 and user_name is null;'
const ALL_INVALID_NON_USER_TOKENS = 'select count(*) from token where status = 1 and user_name is null;'
const ALL_VALID_USER_TOKENS = 'select count(*) from token where status = 0 and user_name is not null;'
const ALL_INVALID_USER_TOKENS = 'select count(*) from token where status = 1 and user_name is not null;'

const COUNT_DUPLICATE_TOKENS = `SELECT authentication_id, client_id
FROM token
WHERE status COLLATE utf8_unicode_ci = 0
GROUP BY authentication_id
HAVING COUNT(*) > 1;`

const DELETE_INVALID_TOKEN_SQL = 'delete from token where status = 1 limit ?;'
const DELETE_VALID_USER_TOKEN_SQL = 'delete from token where status = 0 and user_name is not null limit ?;'

export const getDuplicateTokens = async (): Promise<IPartialToken[]> => {
  return await fetchRows<IPartialToken>(COUNT_DUPLICATE_TOKENS, [], 'identity')
}

export const deactivateTokens = async (authenticationIds: string[]): Promise<void> => {
  const formattedIdParams = authenticationIds.map(() => '?').join(',')
  const sql = `
UPDATE token
SET status = 1
WHERE authentication_id COLLATE utf8_unicode_ci in (${formattedIdParams}) AND status COLLATE utf8_unicode_ci = 0;`
  await executeUpdate(sql, authenticationIds, 'identity')
}

const deleteTokens = async (sql: string, tokenCount: number): Promise<void> => {
  while (tokenCount > 0) {
    await executeUpdate(sql, [deleteBatchSize], 'identity')
    tokenCount = tokenCount - deleteBatchSize
  }
}

export const countAllTokens = async (): Promise<number> => {
  return await fetchCount(ALL_TOKENS, [], 'identity')
}

export const countAllValidNonUserTokens = async (): Promise<number> => {
  return await fetchCount(ALL_VALID_NON_USER_TOKENS, [], 'identity')
}

export const countAllInvalidNonUserTokens = async (): Promise<number> => {
  return await fetchCount(ALL_INVALID_NON_USER_TOKENS, [], 'identity')
}

export const countAllValidUserTokens = async (): Promise<number> => {
  return await fetchCount(ALL_VALID_USER_TOKENS, [], 'identity')
}

export const countAllInvalidUserTokens = async (): Promise<number> => {
  return await fetchCount(ALL_INVALID_USER_TOKENS, [], 'identity')
}

export const deleteInvalidTokens = async (count: number): Promise<void> => {
  await deleteTokens(DELETE_INVALID_TOKEN_SQL, count)
}

export const deleteValidTokens = async (count: number): Promise<void> => {
  await deleteTokens(DELETE_VALID_USER_TOKEN_SQL, count)
}
