"use client"

import type { ReactNode } from "react"
import { Button } from "@shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card"
import { Input } from "@shared/components/ui/input"
import { Skeleton } from "@shared/components/ui/skeleton"
import { useAuthGuard } from "./use-auth-guard"

export function AuthGuard({ children }: { children: ReactNode }) {
  const { phase, error, signInWith } = useAuthGuard()

  if (phase === "checking") return <Skeleton className="h-svh w-full" />
  if (phase === "ready") return <>{children}</>

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void signInWith(new FormData(e.currentTarget))
            }}
          >
            <Input name="email" type="email" placeholder="Email" autoComplete="username" required />
            <Input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
