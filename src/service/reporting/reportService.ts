import * as azureBlobService from '../azure/storage/blob'
import { JobsFile } from '../file/models'
import { getCompletedCourseRecords } from '../../db/shared/database'
import { objsToCsv } from '../file/csv'
import { type EncryptedZipResult, zipFiles } from '../file/zip'
import { type UploadResult } from '../azure/storage/blob'

const MI_BLOB_CONTAINER = 'mi-storage'

interface UploadedZipReport {
  zip: EncryptedZipResult
  uploadResult: UploadResult
}

const uploadFile = async (file: JobsFile): Promise<UploadResult> => {
  return await azureBlobService.uploadFile(MI_BLOB_CONTAINER, file)
}

export const generateCourseCompletionsReportZip = async (lastSuccessTimestamp: Date, toTimestamp: Date): Promise<UploadedZipReport | undefined> => {
  const completions = await getCompletedCourseRecords(lastSuccessTimestamp, toTimestamp)
  if (completions.length > 0) {
    const fileName = getTimeRangeFileName('course_completions', lastSuccessTimestamp, toTimestamp)
    const csv = objsToCsv(completions)
    const csvFile = JobsFile.from(`${fileName}.csv`, csv)
    const zipFile = await zipFiles([csvFile], fileName)
    const uploadResult = await uploadFile(zipFile.result)
    return {
      zip: zipFile,
      uploadResult
    }
  } else {
    return undefined
  }
}

const getTimeRangeFileName = (key: string, startTimestamp: Date, endTimestamp: Date): string => {
  const replaceRegex = /[-,:,\s]/ig
  const startFmt = startTimestamp.toISOString().replaceAll(replaceRegex, '_')
  const endFmt = endTimestamp.toISOString().replaceAll(replaceRegex, '_')
  return `${key}_${startFmt}_to_${endFmt}`
}
