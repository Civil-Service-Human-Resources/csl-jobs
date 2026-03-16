import type { Notifier } from '../../src/service/notification/Notifier'

export class TestNotifier implements Notifier {
  constructor (private readonly _notifications: string [] = []) {
  }

  getName (): string {
    return 'Test notifier'
  }

  async notify (message: string): Promise<void> {
    this._notifications.push(message)
  }

  get notifications (): string[] {
    return this._notifications
  }
}
