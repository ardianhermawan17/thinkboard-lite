"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

/**
 * A segmented control (shadcn's toggle-group). It is the accessible shape for a **mode switch**: a `role="group"`
 * whose items carry `aria-pressed`, so it never emits the dangling `aria-controls` a tab list emits when it has no
 * panels (Lighthouse's `aria-valid-attr-value`, 2026-09-26). Use `Tabs` only when there really are tab panels.
 */
const toggleGroupVariants = cva("inline-flex w-fit items-center justify-center gap-1 rounded-lg p-[3px] text-muted-foreground", {
  variants: { variant: { default: "bg-muted", line: "bg-transparent" } },
  defaultVariants: { variant: "default" },
})

const toggleGroupItemVariants = cva(
  "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[state=on]:bg-background data-[state=on]:text-foreground dark:text-muted-foreground dark:hover:text-foreground dark:data-[state=on]:border-input dark:data-[state=on]:bg-input/30 dark:data-[state=on]:text-foreground",
  {
    variants: { variant: { default: "", line: "bg-transparent data-[state=on]:bg-transparent dark:data-[state=on]:bg-transparent" } },
    defaultVariants: { variant: "default" },
  }
)

function ToggleGroup({ className, variant = "default", ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleGroupVariants>) {
  return <ToggleGroupPrimitive.Root data-slot="toggle-group" data-variant={variant} className={cn(toggleGroupVariants({ variant }), className)} {...props} />
}

function ToggleGroupItem({ className, variant = "default", ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleGroupItemVariants>) {
  return <ToggleGroupPrimitive.Item data-slot="toggle-group-item" data-variant={variant} className={cn(toggleGroupItemVariants({ variant }), className)} {...props} />
}

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants }
