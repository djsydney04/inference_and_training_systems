/** Render on a state change, or within a bounded user-triggered animation. */
export class RenderBudget {
  private dirty = true;
  private until = 0;
  invalidate(now: number, duration = 0) {
    if (!Number.isFinite(now) || !Number.isFinite(duration) || duration < 0)
      throw new Error("Invalid render deadline");
    this.dirty = true;
    this.until = Math.max(this.until, now + duration);
  }
  consume(now: number, visible: boolean) {
    if (!visible || (!this.dirty && now >= this.until)) return false;
    this.dirty = false;
    return true;
  }
}
