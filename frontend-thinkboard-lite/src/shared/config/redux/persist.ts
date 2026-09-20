import { createTransform } from "redux-persist"
import createWebStorage from "redux-persist/lib/storage/createWebStorage"

type Slice = Record<string, unknown>

/**
 * Drops every persisted slice's `ui` sub-object on the way out (03 §5.2, I16): throwaway state (errors, open sheets,
 * pending counts) is never written to storage, so it can never rehydrate stale. Coming back in is a no-op.
 */
export const stripUi = createTransform<Slice, Slice>(
  (slice) => (slice && typeof slice === "object" ? Object.fromEntries(Object.entries(slice).filter(([key]) => key !== "ui")) : slice),
  (slice) => slice
)

// Nothing touches `window` at import (SSR): the server gets a storage that stores nothing.
const noopStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
}

export const persistConfig = {
  key: "thinkboard",
  storage: typeof window === "undefined" ? noopStorage : createWebStorage("local"),
  // Slices only, never entities and never a reducerPath (I12); each context adds its slice here (03 §5.3 point 2).
  // Empty until 008 (session, workspace), 009 (viewport) and 007 (sync) ship theirs.
  whitelist: [] as string[],
  transforms: [stripUi],
}
