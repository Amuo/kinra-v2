import { createContext } from "react";
import type { Api } from "./api";

// Keep the context identity stable when Vite refreshes the API implementation.
export const ApiCtx = createContext<Api | null>(null);
