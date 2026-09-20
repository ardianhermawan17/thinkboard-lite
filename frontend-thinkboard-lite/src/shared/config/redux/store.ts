import { combineReducers, configureStore } from "@reduxjs/toolkit"
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer } from "redux-persist"
import { listenerMiddleware } from "./listener"
import { persistConfig } from "./persist"

// The 4-point store edit (03 §5.3). A new slice or api touches exactly these four places:
//   1. rootReducer      the slice or api reducer
//   2. persistConfig    slices only (persist.ts)
//   3. .concat()        the api middleware
//   4. .prepend()       listenerMiddleware.middleware, once (already done below)

// 1. `guard` only keeps combineReducers from warning about an empty object; delete it when the first real slice lands.
const rootReducer = combineReducers({ guard: (state: null = null) => state })

export const makeStore = () =>
  configureStore({
    reducer: persistReducer<ReturnType<typeof rootReducer>>(persistConfig, rootReducer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
      })
        // 3. .concat(api.middleware) goes here, when the first createApi lands
        .prepend(listenerMiddleware.middleware), // 4. once
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
