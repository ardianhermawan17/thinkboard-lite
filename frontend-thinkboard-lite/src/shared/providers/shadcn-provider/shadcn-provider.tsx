"use client"

import { Direction } from "radix-ui"
import type { ReactNode } from "react"

/**
 * Configuration the shadcn/Radix atoms read from context. components.json sets rtl: true, so the atoms are
 * direction-aware; the product's language (Bahasa Indonesia) reads left to right.
 */
export function ShadcnProvider({ children }: { children: ReactNode }) {
  return <Direction.DirectionProvider dir="ltr">{children}</Direction.DirectionProvider>
}
