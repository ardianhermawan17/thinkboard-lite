"use client"

import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Skeleton } from "@shared/components/ui/skeleton"
import { motion, riseChild, stagger } from "@shared/lib/motion"
import { useAuthGuard } from "./use-auth-guard"

/**
 * The sign-in screen. It is the product's first impression, so it shows the product: a page with a highlight
 * sweeping across it, a teammate's cursor and a note chip — the workspace's own vocabulary, not a stock hero.
 * Motion is transform-only (task 036), so a background tab still paints it, and `MotionConfig reducedMotion="user"`
 * makes the loops sit still for anyone who asks.
 */
function ReadingRoom() {
  return (
    <div aria-hidden className="relative mx-auto h-80 w-full max-w-sm">
      <div className="absolute inset-x-0 top-4 rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="h-2.5 w-28 rounded-full bg-muted" />
        <div className="mt-7 flex flex-col gap-3">
          {[100, 92, 96, 72, 86, 64].map((w, i) => (
            <div key={i} className="h-2 rounded-full bg-muted" style={{ width: `${w}%` }} />
          ))}
        </div>

        {/* A highlight is swept across the second line. */}
        <motion.div
          className="absolute top-[4.75rem] left-6 h-4 w-20 rounded-sm bg-highlight-yellow"
          animate={{ x: [0, 118, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
        />
        {/* A teammate's cursor drifts after it. */}
        <motion.div
          className="absolute top-[4.6rem] left-6 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20"
          animate={{ x: [8, 126, 8], y: [0, 44, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      <motion.div
        className="absolute right-0 bottom-8 rounded-pill border bg-card px-3 py-2 text-xs shadow-soft"
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
      >
        <span className="font-medium">Note</span>
        <span className="ml-2 text-muted-foreground">cost basis?</span>
      </motion.div>

      <motion.div
        className="absolute bottom-16 left-0 flex items-center gap-2 rounded-pill border bg-card px-3 py-1.5 text-xs shadow-soft"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
      >
        <span className="h-2 w-2 rounded-full bg-highlight-green" />
        <span className="text-muted-foreground">2 here</span>
      </motion.div>
    </div>
  )
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { phase, error, submitting, showPassword, togglePassword, signInWith } = useAuthGuard()

  if (phase === "checking") return <Skeleton className="h-svh w-full" />
  if (phase === "ready") return <>{children}</>

  return (
    <main className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* The brand side: atmosphere from one soft accent glow, and the product's own motif in a double bezel. Hidden
          on narrow screens so the form is never below the fold on a phone. */}
      <section className="relative hidden overflow-hidden border-r bg-muted/25 p-10 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-highlight-yellow/15 blur-3xl" />

        <p className="relative inline-flex w-max items-center gap-2 rounded-pill border border-border bg-card/70 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          ThinkBoard Lite · pilot
        </p>

        <div className="relative max-w-md">
          <p className="text-4xl leading-[1.05] font-medium tracking-tight text-balance">Read the document together.</p>
          <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
            Highlight a line, pin a note, and watch a teammate&rsquo;s cursor arrive. It keeps working with the network off.
          </p>

          {/* The double bezel: a machined outer shell, the content on an inner core with a concentric radius. */}
          <div className="mt-12 rounded-[1.75rem] bg-muted/50 p-2 ring-1 ring-border shadow-soft">
            <div className="rounded-[calc(1.75rem-0.5rem)] bg-card p-2 shadow-inset mix-blend-normal">
              <ReadingRoom />
            </div>
          </div>
        </div>

        <p className="relative font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">local-first · offline-capable</p>
      </section>

      {/* The form side. */}
      <section className="flex items-center justify-center p-6">
        <motion.form
          variants={stagger}
          initial="hidden"
          animate="show"
          onSubmit={(e) => {
            e.preventDefault()
            void signInWith(new FormData(e.currentTarget))
          }}
          className="w-full max-w-sm"
        >
          <motion.div variants={riseChild}>
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase lg:hidden">ThinkBoard Lite</p>
            <h1 className="mt-2 text-2xl font-medium tracking-tight">Sign in</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Open your workspace and pick up where you left off.</p>
          </motion.div>

          <motion.div variants={riseChild} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="username"
                required
                autoFocus
                disabled={submitting}
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                  className="h-11 pe-16"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 end-1.5 my-auto h-8 rounded-pill px-3 text-xs text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </motion.div>

          <motion.div variants={riseChild} className="mt-6">
            {/* Button-in-button: the trailing arrow sits in its own circle and drifts on hover. */}
            <Button
              type="submit"
              disabled={submitting}
              className="group/cta h-11 w-full justify-between rounded-pill ps-5 pe-1.5 text-[0.95rem]"
            >
              <span>{submitting ? "Signing in…" : "Sign in"}</span>
              <span className="flex size-8 items-center justify-center rounded-pill bg-primary-foreground/15 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-px group-hover/cta:scale-105">
                <ArrowRight className="size-4" />
              </span>
            </Button>
          </motion.div>
        </motion.form>
      </section>
    </main>
  )
}
