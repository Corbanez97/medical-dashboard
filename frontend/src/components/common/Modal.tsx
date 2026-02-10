import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2>{title}</h2>
                    <button
                        type="button"
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "1.5rem",
                            lineHeight: "1",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}
