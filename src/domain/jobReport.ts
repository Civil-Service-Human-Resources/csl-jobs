export default class JobReport{
  successful: number = 0
  errors: string[] = []

  addSuccessful(){
    this.successful++
  }

  addError(error: string){
    this.errors.push(error)
  }

  getReport(){
    return `Successful processes: ${this.successful}, Failed processes: ${this.errors.length}`
  }
}