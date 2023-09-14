export class JobsFile {
  constructor (public readonly filename: string, public readonly contents: Buffer) { }
  static from (filename: string, contents: string | Buffer): JobsFile {
    return new JobsFile(filename, Buffer.from(contents))
  }
}
