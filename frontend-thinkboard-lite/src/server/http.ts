import { errorMessage, httpStatusFor } from "./db/errors"

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

/** RULE-22: the route's only branch — a typed error becomes a status. */
export function errorResponse(error: unknown): Response {
  return json({ error: errorMessage(error) }, httpStatusFor(error))
}
