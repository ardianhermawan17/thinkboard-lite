"use client"

import type { ReactNode } from "react"
import { Toaster } from "@shared/components/ui/sonner"
import { TooltipProvider } from "@shared/components/ui/tooltip"
import { ReduxProvider } from "./redux-provider"
import { ShadcnProvider } from "./shadcn-provider"
import { ThemeProvider } from "./theme-provider"

/**
 * The only export app/ uses (04 §3.3). The order is fixed: Redux > PersistGate (inside ReduxProvider) > Shadcn >
 * Theme > Tooltip. The Toaster is mounted once, inside Theme so it follows light and dark.
 */
export function LibraryProvider({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <ShadcnProvider>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </ShadcnProvider>
    </ReduxProvider>
  )
}
