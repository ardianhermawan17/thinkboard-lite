"use client"

import { Button } from "@shared/components/ui/button"
import { motion, pop } from "@shared/lib/motion"
import { useOnboardingTour } from "./use-onboarding-tour"

/**
 * The first-run tour. It dims the workspace, cuts a hole over the thing being explained, and walks through the
 * document view in eight steps. The hole is four springs that the scrim's `clip-path` is derived from, and the card
 * pops in per step. Because the scrim is clipped, the spotlight itself stays clickable — the app under it is blocked
 * everywhere else.
 *
 * The render is pure: every hook lives in `use-onboarding-tour.ts` (I2).
 */
export function OnboardingTour() {
  const { open, index, total, last, step, rect, clipPath, cardRef, cardStyle, next, back, skip } = useOnboardingTour()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70]">
      {/* The scrim, clipped so the spotlight is a hole: outside it the app is dimmed and unclickable. The clip-path
          has the same shape at every step, so CSS transitions the hole between targets (and not at all under
          reduced motion). */}
      <div
        aria-hidden
        className="absolute inset-0 bg-foreground/55 transition-[clip-path] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ clipPath }}
      />

      {rect && (
        <motion.div
          aria-hidden
          initial={false}
          animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="pointer-events-none absolute rounded-2xl ring-2 ring-primary"
        />
      )}

      <motion.div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        key={step.id}
        variants={pop}
        initial="hidden"
        animate="show"
        style={cardStyle}
        className="absolute rounded-2xl border border-border bg-popover p-5 shadow-lift outline-none"
      >
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          {index + 1} / {total}
        </p>
        <h2 id="tour-title" className="mt-2 text-lg font-medium tracking-tight">
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={skip} className="rounded-pill px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            Skip
          </button>
          <div aria-hidden className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={i === index ? "h-1.5 w-4 rounded-pill bg-primary" : "h-1.5 w-1.5 rounded-pill bg-muted-foreground/40"} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <Button size="sm" variant="ghost" onClick={back}>
                Back
              </Button>
            )}
            <Button size="sm" className="rounded-pill" onClick={next}>
              {last ? "Start reading" : "Next"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
