import { createContext } from "react"
import type { AuthContextType } from "./types"

// Global singleton bridge to survive Vite HMR reloads and prevent dual-instance context failure
declare global {
  // eslint-disable-next-line no-var
  var __VTRYON_AUTH_CONTEXT__: React.Context<AuthContextType | undefined> | undefined
}

export const AuthContext =
  globalThis.__VTRYON_AUTH_CONTEXT__ ??= createContext<AuthContextType | undefined>(undefined)
