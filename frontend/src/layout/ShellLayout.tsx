import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type Props = {
  children: ReactNode;
};

export function ShellLayout({ children }: Props) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img
            className="brand__logo"
            src="/Logo%202d.jpeg"
            alt="Instituto Tatsch"
            onError={(event) => {
              const target = event.currentTarget;
              target.style.display = "none";
            }}
          />
          <div>
            <h1>Instituto Tatsch Dashboard</h1>
            <p>Nutrology clinic panel for weight and longevity care</p>
          </div>
        </div>

        <nav className="main-nav">
          <NavLink to="/patients" className={({ isActive }) => `pill-link ${isActive ? "pill-link--active" : ""}`}>
            Patients
          </NavLink>
          <NavLink
            to="/lab-definitions"
            className={({ isActive }) => `pill-link ${isActive ? "pill-link--active" : ""}`}
          >
            Lab definitions
          </NavLink>
        </nav>
      </header>

      <main className="page-frame">{children}</main>
    </div>
  );
}
