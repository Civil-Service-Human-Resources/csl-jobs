import { executeUpdate, fetchCount, fetchRows } from '../connection'
import config from '../../config'
import type { IPartialToken } from './model'
import type { IDomain } from '../../service/orgDomains/model/IDomain'

const { jobs: { redundantTokens: { deleteBatchSize } } } = config

const ALL_TOKENS = 'select count(*) from oauth2_authorization;'
const ALL_VALID_NON_USER_TOKENS = 'select count(*) from oauth2_authorization where authorization_grant_type = "client_credentials" and access_token_expires_at > now();'
const ALL_INVALID_NON_USER_TOKENS = 'select count(*) from oauth2_authorization where authorization_grant_type = "client_credentials" and access_token_expires_at <= now();'
const ALL_VALID_USER_TOKENS = 'select count(*) from oauth2_authorization where authorization_grant_type = "authorization_code" and access_token_expires_at > now();'
const ALL_INVALID_USER_TOKENS = 'select count(*) from oauth2_authorization where authorization_grant_type = "authorization_code" and access_token_expires_at <= now();'

const COUNT_DUPLICATE_TOKENS = `SELECT authentication_id, client_id
FROM token
WHERE status = 0
GROUP BY authentication_id
HAVING COUNT(*) > 1;`

const DELETE_INVALID_NON_USER_TOKEN_SQL = 'delete from oauth2_authorization where authorization_grant_type = "client_credentials" and access_token_expires_at <= now() limit {{limit}};'
const DELETE_INVALID_USER_TOKEN_SQL = 'delete from oauth2_authorization where authorization_grant_type = "authorization_code" and access_token_expires_at <= now() limit {{limit}};'

export const getDuplicateTokens = async (): Promise<IPartialToken[]> => {
  return await fetchRows<IPartialToken>(COUNT_DUPLICATE_TOKENS, [], 'identity')
}

export const deactivateTokens = async (authenticationIds: string[]): Promise<void> => {
  const formattedIdParams = authenticationIds.map(() => '?').join(',')
  const sql = `
UPDATE token
SET status = 1
WHERE authentication_id in (${formattedIdParams}) AND status = 0;`
  await executeUpdate(sql, authenticationIds, 'identity')
}

export const getAllDomains = async (): Promise<IDomain[]> => {
  const query = `SELECT DISTINCT(domain) FROM (
        SELECT SUBSTRING_INDEX(email,'@', -1) AS domain FROM identity.identity
        ) AS domains
      ORDER BY domain;`
  return await fetchRows<IDomain>(query, [])
}

const deleteTokens = async (sql: string, tokenCount: number): Promise<void> => {
  while (tokenCount > 0) {
    await executeUpdate(sql.replace('{{limit}}', deleteBatchSize.toString()), [], 'identity')
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

export const deleteInvalidNonUserTokens = async (count: number): Promise<void> => {
  await deleteTokens(DELETE_INVALID_NON_USER_TOKEN_SQL, count)
}

export const deleteInvalidUserTokens = async (count: number): Promise<void> => {
  await deleteTokens(DELETE_INVALID_USER_TOKEN_SQL, count)
}
