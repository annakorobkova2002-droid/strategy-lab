import { useEffect, useState } from "react";
import { useRoute } from "./router";
import { useStore } from "./store";
import { Dashboard } from "./pages/Dashboard";
import { Library } from "./pages/Library";
import { LectureView } from "./pages/LectureView";
import { Quiz } from "./pages/Quiz";
import { Flashcards } from "./pages/Flashcards";
import { Mistakes } from "./pages/Mistakes";
import { Glossary } from "./pages/Glossary";
import { Settings } from "./pages/Settings";

const NAV = [
  ["", "Dashboard"],
  ["lectures", "Lecture library"],
  ["quiz", "Quiz"],
  ["flashcards", "Flashcards"],
  ["mistakes", "Mistake notebook"],
  ["glossary", "Glossary"],
  ["settings", "Settings & data"],
] as const;

const TABS = [
  ["", "Home", "home"],
  ["lectures", "Lectures", "book"],
  ["quiz", "Quiz", "quiz"],
  ["flashcards", "Cards", "cards"],
] as const;

const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  book: "M4 4.5A1.5 1.5 0 0 1 5.5 3H11v17H5.5A1.5 1.5 0 0 1 4 18.5zM13 3h5.5A1.5 1.5 0 0 1 20 4.5v14a1.5 1.5 0 0 1-1.5 1.5H13z",
  quiz: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.9M12 17h.01",
  cards: "M7 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2M4 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
};

function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg className={`icon icon-${name}`} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function App() {
  const { path } = useRoute();
  const { saveFailed } = useStore();
  const [menu, setMenu] = useState(false);
  const top = path[0] ?? "";

  // Close the mobile drawer on navigation or Escape, and lock page scroll while it is open.
  useEffect(() => setMenu(false), [path.join("/")]);
  useEffect(() => {
    document.body.classList.toggle("drawer-open", menu);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  let page;
  switch (top) {
    case "lectures":
      page = path[1] ? <LectureView id={path[1]} /> : <Library />;
      break;
    case "quiz":
      page = <Quiz />;
      break;
    case "flashcards":
      page = <Flashcards />;
      break;
    case "mistakes":
      page = <Mistakes />;
      break;
    case "glossary":
      page = <Glossary />;
      break;
    case "settings":
      page = <Settings />;
      break;
    default:
      page = <Dashboard />;
  }

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="brand-mark">S</span>
          <b>Strategy Lab</b>
        </a>
        <button className="menu-btn" aria-expanded={menu} aria-controls="sidenav" aria-label={menu ? "Close menu" : "Open menu"} onClick={() => setMenu(!menu)}>
          <Icon name={menu ? "close" : "menu"} />
        </button>
      </header>
      <nav id="sidenav" className={`sidenav ${menu ? "open" : ""}`} aria-label="Main">
        <a className="brand desktop" href="#/">
          <span className="brand-mark">S</span>
          <span><b>Strategy Lab</b><small>Business Strategy · 2026–27</small></span>
        </a>
        <ul>
          {NAV.map(([to, label]) => (
            <li key={to}>
              <a href={`#/${to}`} className={top === to ? "active" : ""} aria-current={top === to ? "page" : undefined} onClick={() => setMenu(false)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="nav-foot">Prof. G. Ciambotti · Group A–K<br />Università Cattolica</p>
      </nav>
      {menu && <div className="scrim" onClick={() => setMenu(false)} aria-hidden="true" />}
      <main id="main" className="main" tabIndex={-1}>
        {saveFailed && <div className="banner">Progress could not be saved in this browser (storage full or disabled). Export a backup from Settings.</div>}
        {page}
      </main>
      <nav className="tabbar" aria-label="Quick navigation">
        {TABS.map(([to, label, icon]) => (
          <a key={to} href={`#/${to}`} className={top === to && !menu ? "active" : ""} aria-current={top === to ? "page" : undefined}>
            <Icon name={icon} />
            <span>{label}</span>
          </a>
        ))}
        <button className={menu || ["mistakes", "glossary", "settings"].includes(top) ? "active" : ""} aria-expanded={menu} aria-controls="sidenav" onClick={() => setMenu(!menu)}>
          <Icon name="more" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
