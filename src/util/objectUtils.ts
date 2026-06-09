import { validate, type ValidationError } from 'class-validator'

export class Validatable {
  async validateObject (): Promise<ValidationError[]> {
    return await validate(this)
  }
}
