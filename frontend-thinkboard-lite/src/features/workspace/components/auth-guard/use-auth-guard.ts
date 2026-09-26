"use client"

import { useEffect, useState } from "react"
import { openDb } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectError, selectProfileId } from "../../selectors/workspace-selectors"
import { failed, signedIn } from "../../stores/workspace-slice"
import { hasSession, signIn } from "../../utils/workspace-remote"

export type AuthPhase = "checking" | "signedOut" | "ready"

/** RULE-14: ready needs a cached session (read from storage, no network) and the persisted profile id, so an offline reopen works. */
export function useAuthGuard() {
  const dispatch = useAppDispatch()
  const profileId = useAppSelector(selectProfileId)
  const error = useAppSelector(selectError)
  const [checked, setChecked] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  // The sign-in screen's own state lives here, not in the .tsx (I2: a .tsx with a sibling use-*.ts keeps no hooks).
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    hasSession()
      .then(setHasToken)
      .catch(() => setHasToken(false))
      .finally(() => setChecked(true))
  }, [])

  const phase: AuthPhase = !checked ? "checking" : hasToken && profileId ? "ready" : "signedOut"
  // Idempotent and lazy: opens this profile's Dexie database before any child reads it (children mount only when ready).
  if (phase === "ready" && profileId) openDb(profileId)

  async function signInWith(form: FormData) {
    setSubmitting(true)
    try {
      const id = await signIn(String(form.get("email")), String(form.get("password")))
      dispatch(signedIn({ profileId: id }))
      setHasToken(true)
    } catch (e) {
      dispatch(failed(e instanceof Error ? e.message : "Sign in failed"))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    phase,
    error,
    submitting,
    showPassword,
    togglePassword: () => setShowPassword((shown) => !shown),
    signInWith,
  }
}
