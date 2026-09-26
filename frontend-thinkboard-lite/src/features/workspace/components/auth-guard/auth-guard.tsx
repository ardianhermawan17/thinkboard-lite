"use client"

import type { ReactNode } from "react"
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
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* A teammate's cursor drifts after it. */}
        <motion.div
          className="absolute top-[4.6rem] left-6 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20"
          animate={{ x: [8, 126, 8], y: [0, 44, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="absolute right-0 bottom-8 rounded-xl border bg-card px-3 py-2 text-xs shadow-xl"
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-medium">Note</span>
        <span className="ml-2 text-muted-foreground">cost basis?</span>
      </motion.div>

      <motion.div
        className="absolute bottom-16 left-0 flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs shadow-lg"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
      {/* The brand side: atmosphere from two soft glows, and the product's own motif. Hidden on narrow screens so
          the form is never below the fold on a phone. */}
      <section className="relative hidden overflow-hidden border-r bg-muted/30 p-10 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-highlight-yellow/20 blur-3xl" />

        <p className="relative flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-highlight-yellow" />
          ThinkBoard Lite · pilot
        </p>

        <div className="relative max-w-md">
          <p className="text-3xl leading-tight font-medium text-balance">Read the document together.</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Highlight a line, pin a note, and watch a teammate&rsquo;s cursor arrive. It keeps working with the network off.
          </p>
          <div className="mt-12">
            <ReadingRoom />
          </div>
        </div>

        <p className="relative font-mono text-[11px] tracking-widest text-muted-foreground uppercase">local-first · offline-capable</p>
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
            <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase lg:hidden">ThinkBoard Lite</p>
            <h1 className="mt-2 text-2xl font-medium">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Open your workspace and pick up where you left off.</p>
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
                className="h-10"
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
                  className="h-10 pe-16"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 end-1.5 my-auto h-7 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </motion.div>

          <motion.div variants={riseChild} className="mt-6">
            <Button type="submit" disabled={submitting} className="h-10 w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </motion.div>
        </motion.form>
      </section>
    </main>
  )
}
