// Branded primitives for the domain rows (I9): an id or a timestamp is never a bare string, so a highlight id
// cannot be passed where a session id is expected. Hand-written: the only file in domain/ that is not generated.
declare const brand: unique symbol
type Brand<T, B extends string> = T & { readonly [brand]: B }

/** A row id. `UUID<"sessions">` is a sessions id; a bare `UUID` accepts any of them. */
export type UUID<Table extends string = string> = Brand<string, `uuid:${Table}`>

/** An ISO-8601 timestamp as Postgres returns it. */
export type ISODateString = Brand<string, "iso-date">

/** A jsonb column (bbox, ink, ...). */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
