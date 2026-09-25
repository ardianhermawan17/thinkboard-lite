// 03 §7: Pointer Events only, never mouse-only. `pointerType === 'pen'` seen once in a session enables palm
// rejection by ignoring `touch` for drawing; a finger still draws until a pen is seen (Q9 default: "assume a
// pen; finger must still work"). Pure, no React, no Konva — the marquee hook holds the session flag in a ref.

export type PointerKind = "pen" | "touch" | "mouse" | "unknown"

export function pointerKind(pointerType: string | null | undefined): PointerKind {
  switch (pointerType) {
    case "pen":
      return "pen"
    case "touch":
      return "touch"
    case "mouse":
      return "mouse"
    default:
      return "unknown"
  }
}

/** Palm rejection: once a pen has been seen this session, a touch is a palm/knuckle, never a stroke. */
export function isPalm(pointerType: string | null | undefined, penSeen: boolean): boolean {
  return penSeen && pointerKind(pointerType) === "touch"
}

/** A pen or a mouse always captures; a finger captures only while no pen has been seen this session. */
export function shouldCapture(pointerType: string | null | undefined, penSeen: boolean): boolean {
  const kind = pointerKind(pointerType)
  if (kind === "touch") return !penSeen
  return kind === "pen" || kind === "mouse"
}

/** Fold the current pointer into the session's pen-seen flag. */
export function withPenSeen(penSeen: boolean, pointerType: string | null | undefined): boolean {
  return penSeen || pointerKind(pointerType) === "pen"
}
