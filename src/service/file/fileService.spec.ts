import { expect } from 'chai'
import os from 'os'
import path from 'path'
import sinon from 'sinon'
import { promises as fs } from 'fs'
import { validateBaseDirAndFileName, validateFileName, writeFile } from './fileService'

describe('writeFile', () => {
  let writeStub: sinon.SinonStub

  beforeEach(() => {
    writeStub = sinon.stub(fs, 'writeFile').resolves()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should call fs.writeFile with correct arguments', async () => {
    const fakePath = '/tmp/test-file.txt'
    const fakeData = Buffer.from('hello')
    const fakeEncoding = 'utf8'

    await writeFile(fakePath, fakeData, fakeEncoding)

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(writeStub.calledOnce).to.be.true
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(writeStub.calledWith(fakePath, fakeData, fakeEncoding)).to.be.true
  })

  it('should default encoding to utf8', async () => {
    const fakePath = '/tmp/test-file2.txt'
    const fakeData = Buffer.from('content')

    await writeFile(fakePath, fakeData)

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(writeStub.calledOnce).to.be.true
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(writeStub.calledWith(fakePath, fakeData, 'utf8')).to.be.true
  })
})

describe('validateBaseDirAndFileName', () => {
  const baseDir = path.resolve(__dirname, 'data')

  it('returns resolved path for a valid file name', () => {
    const result = validateBaseDirAndFileName(baseDir, 'skills.csv')
    expect(result).to.equal(path.resolve(baseDir, 'skills.csv'))
  })

  it('throws if resolved path escapes the base directory', () => {
    expect(() =>
      validateBaseDirAndFileName(baseDir, '../secret.txt')
    ).to.throw('File name must not contain slashes: ../secret.txt')
  })

  it('throws for absolute file paths', () => {
    const abs = path.resolve('/etc/passwd')
    expect(() =>
      validateBaseDirAndFileName(baseDir, abs)
    ).to.throw('File name must not contain slashes: /etc/passwd')
  })

  it('throws for invalid characters in file name', () => {
    expect(() =>
      validateBaseDirAndFileName(baseDir, 'bad name.csv')
    ).to.throw('Invalid characters in file name')

    expect(() =>
      validateBaseDirAndFileName(baseDir, 'test!.txt')
    ).to.throw('Invalid characters in file name')
  })

  it('allows filenames with letters, numbers, dot, underscore, hyphen', () => {
    const good = 'data_file-01.JSON'
    const result = validateBaseDirAndFileName(baseDir, good)
    expect(result).to.equal(path.resolve(baseDir, good))
  })
})

describe('validateFileName', () => {
  it('allows valid filenames', () => {
    expect(() => { validateFileName('skills.csv') }).to.not.throw()
    expect(() => { validateFileName('data_2025-01.json') }).to.not.throw()
  })

  it('throws when filename contains forward slash', () => {
    expect(() => { validateFileName('folder/file.txt') }).to.throw(
      'File name must not contain slashes'
    )
  })

  it('throws when filename contains backslash', () => {
    expect(() => { validateFileName('folder\\file.txt') }).to.throw(
      'File name must not contain slashes'
    )
  })

  it('throws when filename contains ".."', () => {
    expect(() => { validateFileName('..hidden') }).to.throw('Invalid file name')
    expect(() => { validateFileName('data..txt') }).to.throw('Invalid file name')
    expect(() => { validateFileName('../evil.txt') }).to.throw('File name must not contain slashes: ../evil.txt')
  })

  it('allows filenames without slashes and without ".."', () => {
    expect(() => { validateFileName('report-01.txt') }).to.not.throw()
  })

  it('throws for invalid characters in file name', () => {
    expect(() => { validateFileName('bad name.csv') }).to.throw('Invalid characters in file name')
    expect(() => { validateFileName('test!.txt') }).to.throw('Invalid characters in file name')
  })
})

describe('validateBaseDirAndFileName using os.tmpdir()', () => {
  const localTempDir = os.tmpdir()

  it('returns resolved path for a valid filename inside tmpdir', () => {
    const fileName = 'testfile.csv'
    const result = validateBaseDirAndFileName(localTempDir, fileName)

    expect(result).to.equal(path.resolve(localTempDir, fileName))
  })

  it('throws when filename attempts directory traversal', () => {
    expect(() =>
      validateBaseDirAndFileName(localTempDir, '../hack.txt')
    ).to.throw('File name must not contain slashes: ../hack.txt')
  })

  it('throws for absolute paths', () => {
    const abs = path.resolve('/', 'etc', 'passwd')

    expect(() =>
      validateBaseDirAndFileName(localTempDir, abs)
    ).to.throw('File name must not contain slashes: /etc/passwd')
  })

  it('throws for invalid characters in filename', () => {
    expect(() =>
      validateBaseDirAndFileName(localTempDir, 'bad name.csv')
    ).to.throw('Invalid characters in file name')

    expect(() =>
      validateBaseDirAndFileName(localTempDir, 'test!.txt')
    ).to.throw('Invalid characters in file name')
  })

  it('allows safe characters (letters, numbers, dot, underscore, hyphen)', () => {
    const fileName = 'data_file-01.json'
    const result = validateBaseDirAndFileName(localTempDir, fileName)

    expect(result).to.equal(path.resolve(localTempDir, fileName))
  })
})
