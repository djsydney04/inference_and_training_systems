/** A reading clock, never a model of device time. Hidden time earns no steps. */
export class DiagramClock {
  private due: number | null = null;
  private started = false;
  private readonly interval: number;
  constructor(interval = 6000) { this.interval = interval; }

  reset() { this.due = null; }

  tick(now: number, eligible: boolean): boolean {
    if (!eligible) { this.reset(); return false; }
    if (this.due === null) {
      this.due = now + this.interval;
      if (!this.started) { this.started = true; return true; }
      return false;
    }
    if (now < this.due) return false;
    this.due = now + this.interval;
    return true;
  }
}
