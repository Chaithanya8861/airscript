/**
 * Raw landmark coordinates from MediaPipe jitter noticeably frame to frame,
 * even when your hand is perfectly still. Drawing that raw signal makes the
 * "pen" look shaky. An exponential moving average (EMA) fixes this cheaply:
 * each new point is blended with the previous smoothed point instead of
 * used directly.
 *
 * alpha controls responsiveness vs. smoothness:
 *   - closer to 1 -> snappier, more jitter
 *   - closer to 0 -> smoother, more lag
 * 0.4-0.6 is a reasonable starting point for fingertip tracking. Tune it
 * live and feel the difference.
 */
export class PointSmoother {
  constructor(alpha = 0.5) {
    this.alpha = alpha;
    this.smoothed = null;
  }

  next(point) {
    if (!this.smoothed) {
      this.smoothed = { ...point };
      return this.smoothed;
    }
    this.smoothed = {
      x: this.alpha * point.x + (1 - this.alpha) * this.smoothed.x,
      y: this.alpha * point.y + (1 - this.alpha) * this.smoothed.y,
    };
    return this.smoothed;
  }

  reset() {
    this.smoothed = null;
  }
}

/**
 * Simple Euclidean distance between two {x, y} points in the same
 * coordinate space. Used for pinch detection, gesture math, etc.
 */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
