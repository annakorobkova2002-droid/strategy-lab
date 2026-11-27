import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Progress } from "./types";
import { load, save } from "./storage";

interface Store {
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  replace: (p: Progress) => void;
  saveFailed: boolean;
}

const Ctx = createContext<Store | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => load());
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!save(progress));
  }, [progress]);

  useEffect(() => {
    const t = progress.settings.theme;
    const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [progress.settings.theme]);

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress((p) => fn(p)), []);
  const replace = useCallback((p: Progress) => setProgress(p), []);

  return <Ctx.Provider value={{ progress, update, replace, saveFailed }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside ProgressProvider");
  return s;
}
