import { cn } from "cn"

/**
 * A skeleton that matches the shape it stands in for. It shimmers (a transform-driven sweep) rather than pulsing,
 * which reads as "loading" instead of "disabled"; the sweep is a transform, so it costs the compositor only.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("relative overflow-hidden rounded-md bg-muted/70 before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.07] before:to-transparent before:content-[''] before:[animation:tb-shimmer_1.7s_cubic-bezier(0.4,0,0.2,1)_infinite] motion-reduce:before:hidden", className)}
      {...props}
    />
  )
}

export { Skeleton }
