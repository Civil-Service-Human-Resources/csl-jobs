export function getArrayFromCsvEnvVar (envVarCsv: string | undefined): string[] {
  if (envVarCsv !== undefined && envVarCsv != null && envVarCsv.trim() !== '') {
    return envVarCsv.split(',')
  } else {
    return []
  }
}
