import { useState } from "react";
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

export function App() {
  const { path } = useRoute();
  const { saveFailed } = useStore();
  const [menu, setMenu] = useState(false);
  const top = path[0] ?? "";

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
        <button className="menu-btn" aria-expanded={menu} aria-controls="sidenav" onClick={() => setMenu(!menu)}>Menu</button>
        <a className="brand" href="#/">
          <span className="brand-mark">S</span>
          <span><b>Strategy Lab</b><small>Business Strategy · 2026–27</small></span>
        </a>
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
      <main id="main" className="main" tabIndex={-1}>
        {saveFailed && <div className="banner">Progress could not be saved in this browser (storage full or disabled). Export a backup from Settings.</div>}
        {page}
      </main>
    </div>
  );
}
