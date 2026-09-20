import { createListenerMiddleware, type TypedStartListening } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "./store"

export const listenerMiddleware = createListenerMiddleware()

/**
 * Every context registers its side effects through this (03 §5.3 point 4). The middleware itself is prepended ONCE,
 * in store.ts; forgetting that fails silently, exactly like a forgotten api middleware.
 */
export const startAppListening = listenerMiddleware.startListening as TypedStartListening<RootState, AppDispatch>
