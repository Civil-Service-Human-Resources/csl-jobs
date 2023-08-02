import * as crypto from 'crypto'
import archiver from 'archiver'
import { WritableStreamBuffer } from 'stream-buffers'
import { type JobsFile } from './models'

// eslint-disable-next-line @typescript-eslint/no-var-requires
archiver.registerFormat('zip-encrypted', require('archiver-zip-encrypted'))

export interface EncryptedZipResult {
  result: JobsFile
  password: string
}

const getOutBuffer = (): WritableStreamBuffer => {
  return new WritableStreamBuffer({
    initialSize: (1000 * 1024),
    incrementAmount: (1000 * 1024)
  })
}

const generatePassword = (): string => {
  return crypto.webcrypto.getRandomValues(new BigUint64Array(1))[0].toString(36)
}

const createEncryptedArchive = async (files: JobsFile[], password: string): Promise<Buffer> => {
  const buffer = getOutBuffer()
  const archive = archiver('zip-encrypted' as any, {
    zlib: {
      level: 5
    },
    encryptionMethod: 'zip20',
    password
  } as any)
  for (const file of files) {
    archive.append(file.contents, {
      name: file.filename
    })
  }
  archive.pipe(buffer)
  await archive.finalize()
  buffer.end()
  return buffer.getContents() as Buffer
}

export const zipFiles = async (files: JobsFile[], zipFilename: string): Promise<EncryptedZipResult> => {
  zipFilename = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`
  const password = generatePassword()
  const archive = await createEncryptedArchive(files, password)
  return {
    result: { filename: `${zipFilename}`, contents: archive },
    password
  }
}
