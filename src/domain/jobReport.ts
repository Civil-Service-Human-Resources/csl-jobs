export default class JobReport {
  successful: number = 0
  errors: string[] = []

  addSuccessful (): void {
    this.successful++
  }

  addError (error: string): void {
    this.errors.push(error)
  }

  getReport (): string {
    return `Successful processes: ${this.successful}, Failed processes: ${this.errors.length}`
  }
}
