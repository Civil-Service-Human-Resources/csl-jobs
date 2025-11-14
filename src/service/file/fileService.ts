import * as fs from 'fs/promises'

export const writeFile = async (path: string, data: Buffer, encoding: BufferEncoding = 'utf8'): Promise<void> => {
  await fs.writeFile(path, data, encoding)
}

export const unlink = async (path: string): Promise<void> => {
  await fs.unlink(path)
}
