import { useEffect, useState } from "react";

/** Minimal hash router (works on GitHub Pages without server rewrites). */
export function useRoute(): { path: string[]; query: URLSearchParams } {
  const read = () => {
    const h = window.location.hash.replace(/^#\/?/, "");
    const [p, q = ""] = h.split("?");
    return { path: p.split("/").filter(Boolean), query: new URLSearchParams(q) };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export const go = (to: string) => {
  window.location.hash = to.startsWith("#") ? to : `#${to}`;
};
