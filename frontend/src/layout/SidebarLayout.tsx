import { type ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";
import {
    Menu,
    ChevronLeft,
    ChevronRight,
    Users,
    Activity,
    BookOpen
} from "lucide-react";

import logo from "../assets/logo.svg";

type Props = {
    children: ReactNode;
};

export function SidebarLayout({ children }: Props) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile sidebar on navigation
    // We can use a key prop on the component or just global click handler, 
    // but since we have React Router, let's just use the fact that NavLink clicks will bubble up.
    // Actually, deeper integration with location would be creating a hook, but here we can just close on link click.

    const handleNavClick = () => {
        if (window.innerWidth <= 768) {
            setIsMobileOpen(false);
        }
    };

    return (
        <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
            {/* Mobile Header */}
            <header className="mobile-header">
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileOpen(true)}
                    aria-label="Open Menu"
                >
                    <Menu size={24} />
                </button>
                {/* <div className="mobile-logo">INSTITUTO TATSCH</div> */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.05em" }}>INSTITUTO</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--primary)", fontWeight: 600 }}>TATSCH</div>
                </div>
                <div style={{ width: "24px" }}></div> {/* Spacer for centering */}
            </header>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${isMobileOpen ? "active" : ""}`}
                onClick={() => setIsMobileOpen(false)}
            />

            <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
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
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                    {/* Close button for mobile */}
                    <button
                        className="sidebar-toggle"
                        style={{ display: "none" }} /* Use CSS to show only on mobile if needed, but we reused styles. Better explicit close button for mobile inside Sidebar? */
                    >
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/patients"
                        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                        title={isCollapsed ? "Pacientes" : ""}
                        onClick={handleNavClick}
                    >
                        <Users size={24} />
                        {!isCollapsed && "Pacientes"}
                    </NavLink>

                    <NavLink
                        to="/lab-definitions"
                        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                        title={isCollapsed ? "Definições" : ""}
                        onClick={handleNavClick}
                    >
                        <Activity size={24} />
                        {!isCollapsed && "Definições"}
                    </NavLink>

                    <a
                        href="/brand/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-item"
                        title={isCollapsed ? "Brand Book" : ""}
                        onClick={handleNavClick}
                    >
                        <BookOpen size={24} />
                        {!isCollapsed && "Brand Book"}
                    </a>
                </nav>
            </aside>

            <main className="main-content" style={{ marginLeft: isCollapsed ? "80px" : "280px", width: "100%", transition: "margin-left 0.3s ease" }}>
                {children}
            </main>
        </div>
    );
}
