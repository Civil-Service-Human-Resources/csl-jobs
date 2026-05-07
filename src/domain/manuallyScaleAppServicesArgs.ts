import { IsIn } from 'class-validator'
import { Validatable } from '../util/objectUtils'

const SCALE_LEVELS = ['UP', 'DOWN']
export type ScaleLevels = typeof SCALE_LEVELS[number]
export class ManuallyScaleAppServicesArgs extends Validatable{
  @IsIn(SCALE_LEVELS, {
    message: 'Scale level must be one of ' + SCALE_LEVELS.join(', ')
  })
  public scaleLevel: ScaleLevels

  constructor (scaleLevel: ScaleLevels) {
    super()
    this.scaleLevel = scaleLevel
  }
}
