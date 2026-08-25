import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export const SessionContext = createContext<Session | null>(null);

export function useOptionalSession(): Session | null {
  return useContext(SessionContext);
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession debe usarse dentro de un SessionContext.Provider con sesión activa");
  }
  return session;
}
