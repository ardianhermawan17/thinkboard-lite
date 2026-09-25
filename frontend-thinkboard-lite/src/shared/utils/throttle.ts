// RULE-20 / spec §5.2: cursors are ephemeral and must not drive React. This is the send policy — at most one
// message per interval, and only when the point actually moved. Pure, so the ~20 Hz behaviour is testable.
export type Point = { x: number; y: number }

export type Throttle = {
  /** True when the caller should send: the point moved AND the interval since the last send has elapsed. */
  shouldSend(point: Point): boolean
  reset(): void
}

export function createThrottle(intervalMs = 50, now: () => number = () => Date.now()): Throttle {
  let lastSentAt = Number.NEGATIVE_INFINITY
  let last: Point | null = null
  return {
    shouldSend(point) {
      const moved = !last || last.x !== point.x || last.y !== point.y
      if (!moved) return false
      const t = now()
      if (t - lastSentAt < intervalMs) return false
      lastSentAt = t
      last = { x: point.x, y: point.y }
      return true
    },
    reset() {
      lastSentAt = Number.NEGATIVE_INFINITY
      last = null
    },
  }
}
