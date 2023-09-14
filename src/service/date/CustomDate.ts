import { parse, toSeconds } from 'iso8601-duration'

export class CustomDate extends Date {
  public addDuration (isoDuration: string): void {
    const seconds = toSeconds(parse(isoDuration))
    this.setSeconds(this.getSeconds() + seconds)
  }

  public subtractDuration (isoDuration: string): void {
    const seconds = toSeconds(parse(isoDuration))
    this.setSeconds(this.getSeconds() - seconds)
  }

  public fixOffset (): void {
    this.setHours(this.getHours() + Math.abs(this.getTimezoneOffset() / 60))
  }
}
