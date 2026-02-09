import { type ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";

import logo from "../assets/logo.svg";

type Props = {
    children: ReactNode;
};

export function SidebarLayout({ children }: Props) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div style={{ display: "flex", width: "100%" }}>
            <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img
                            src={logo}
                            alt="Instituto Tatsch"
                            style={{ width: "32px", height: "32px", filter: "brightness(0) invert(1)" }}
                        />
                        {!isCollapsed && (
                            <div style={{ lineHeight: "1.2", display: "flex", flexDirection: "column" }}>
                                <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.05em" }}>INSTITUTO</div>
                                <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--primary)", fontWeight: 600 }}>TATSCH</div>
                            </div>
                        )}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
                    >
                        {isCollapsed ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="13 17 18 12 13 7"></polyline>
                                <polyline points="6 17 11 12 6 7"></polyline>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="11 17 6 12 11 7"></polyline>
                                <polyline points="18 17 13 12 18 7"></polyline>
                            </svg>
                        )}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/patients"
                        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                        title={isCollapsed ? "Pacientes" : ""}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        {!isCollapsed && "Pacientes"}
                    </NavLink>

                    <NavLink
                        to="/lab-definitions"
                        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                        title={isCollapsed ? "Definições de Exames" : ""}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        {!isCollapsed && "Definições de Exames"}
                    </NavLink>
                </nav>
            </aside>

            <main className="main-content" style={{ marginLeft: isCollapsed ? "80px" : "280px", width: "100%", transition: "margin-left 0.3s ease" }}>
                {children}
            </main>
        </div>
    );
}
