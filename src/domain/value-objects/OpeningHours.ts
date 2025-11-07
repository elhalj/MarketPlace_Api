export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export class OpeningHours {
  constructor(
    private _day: DayOfWeek,
    private _openTime: string,
    private _closeTime: string,
    private _isClosed: boolean = false
  ) {
    this.validateTimes();
  }

  // Getters
  get day(): DayOfWeek {
    return this._day;
  }

  get openTime(): string {
    return this._openTime;
  }

  get closeTime(): string {
    return this._closeTime;
  }

  get isClosed(): boolean {
    return this._isClosed;
  }

  // Methods
  private validateTimes(): void {
    if (!this._isClosed) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(this._openTime) || !timeRegex.test(this._closeTime)) {
        throw new Error('Time must be in HH:mm format (24-hour)');
      }

      const [openHour, openMinute] = this._openTime.split(':').map(Number);
      const [closeHour, closeMinute] = this._closeTime.split(':').map(Number);
      const openMinutes = openHour * 60 + openMinute;
      const closeMinutes = closeHour * 60 + closeMinute;

      if (closeMinutes <= openMinutes) {
        throw new Error('Close time must be after open time');
      }
    }
  }

  isOpenAt(time: Date): boolean {
    if (this._isClosed) return false;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    if (days[time.getDay()] !== this._day) return false;

    const [openHour, openMinute] = this._openTime.split(':').map(Number);
    const [closeHour, closeMinute] = this._closeTime.split(':').map(Number);
    const timeMinutes = time.getHours() * 60 + time.getMinutes();
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    return timeMinutes >= openMinutes && timeMinutes < closeMinutes;
  }

  toJSON() {
    return {
      day: this._day,
      openTime: this._openTime,
      closeTime: this._closeTime,
      isClosed: this._isClosed
    };
  }
}
