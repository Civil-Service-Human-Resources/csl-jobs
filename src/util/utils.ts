import * as crypto from 'crypto'

export function getArrayFromCsvEnvVar (envVarCsv: string | undefined): string[] {
  if (envVarCsv !== undefined && envVarCsv != null && envVarCsv.trim() !== '') {
    return envVarCsv.split(',')
  } else {
    return []
  }
}

export const generatePassword = (): string => {
  return crypto.webcrypto.getRandomValues(new BigUint64Array(1))[0].toString(36)
}
