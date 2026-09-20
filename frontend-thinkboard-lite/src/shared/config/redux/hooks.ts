import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "./store"

// Typed once here; every container uses these, never the bare react-redux hooks.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
