import * as azureBlobService from '../azure/storage/blob/service'
import { type UploadResult } from '../azure/storage/blob/service'
import { JobsFile } from '../file/models'
import { getCompletedCourseRecords } from '../../db/shared/database'
import { objsToCsv } from '../file/csv'
import { type EncryptedZipResult, zipFiles } from '../file/zip'
import dayjs from 'dayjs'

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
    const csv = await objsToCsv(completions)
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

export const getTimeRangeFileName = (key: string, startTimestamp: Date, endTimestamp: Date): string => {
  const formatTokens = 'DD_MM_YYYY'
  const startFmt = dayjs(startTimestamp).format(formatTokens)
  const endFmt = dayjs(endTimestamp).format(formatTokens)
  return `${key}_${startFmt}_to_${endFmt}`
}
