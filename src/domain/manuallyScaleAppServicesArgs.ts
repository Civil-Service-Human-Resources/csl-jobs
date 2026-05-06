import ScaleLevel from "./scaleLevel";

export class ManuallyScaleAppServicesArgs {
  public scaleLevel: ScaleLevel

  constructor (scaleLevel: ScaleLevel) {
    this.scaleLevel = scaleLevel
  }
}