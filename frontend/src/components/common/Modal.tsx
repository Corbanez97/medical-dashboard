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
                <div className="split-row" style={{ marginBottom: "1.5rem" }}>
                    <h2>{title}</h2>
                    <button
                        type="button"
                        className="button button--outline"
                        style={{ padding: "0.25rem 0.5rem", minWidth: "32px" }}
                        onClick={onClose}
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
