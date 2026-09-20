"use client"

import { useState, type ReactNode } from "react"
import { Provider } from "react-redux"
import { persistStore } from "redux-persist"
import { PersistGate } from "redux-persist/integration/react"
import { makeStore } from "@shared/config/redux/store"

/** Redux, then PersistGate (the first two of the fixed provider order, 04 §3.3). One store per browser session. */
export function ReduxProvider({ children }: { children: ReactNode }) {
  // created once, lazily: a new store on every render would drop all state
  const [{ store, persistor }] = useState(() => {
    const store = makeStore()
    return { store, persistor: persistStore(store) }
  })
  return (
    <Provider store={store}>
      {/* ponytail: renders nothing until the persistor has rehydrated; with an empty whitelist that is one tick. */}
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
