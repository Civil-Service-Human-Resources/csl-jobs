import * as fs from 'fs/promises'
import path from 'path'

export const writeFile = async (path: string, data: Buffer, encoding: BufferEncoding = 'utf8'): Promise<void> => {
  await fs.writeFile(path, data, encoding)
}

export const unlink = async (path: string): Promise<void> => {
  await fs.unlink(path)
}

export function validateBaseDirAndFileName (baseDir: string, fileName: string): string {
  if (baseDir.includes('..')) {
    throw new Error(`Invalid directory: ${baseDir}`)
  }

  // Resolve FULL path of the input file
  const resolvedPath = path.resolve(baseDir, fileName)

  // Ensure the resolved path is STILL inside baseDir
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    throw new Error(`Blocked path traversal attempt: ${fileName}`)
  }

  validateFileName(fileName)

  return resolvedPath
}

export function validateFileName (fileName: string): void {
  if (fileName.includes('/') || fileName.includes('\\')) {
    throw new Error(`File name must not contain slashes: ${fileName}`)
  }
  if (fileName.includes('..')) {
    throw new Error(`Invalid file name: ${fileName}`)
  }
  // Disallow absolute paths entirely
  if (path.isAbsolute(fileName)) {
    throw new Error(`Absolute paths not allowed: ${fileName}`)
  }
  // Ensure only safe characters are used
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    throw new Error(`Invalid characters in file name: ${fileName}`)
  }
}
