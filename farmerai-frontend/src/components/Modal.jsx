import React from "react";
import { glass } from "../styles/globalStyles";

export default function Modal({ open, onClose, title, children, actions }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Content */}
      <div className={`${glass.panel} w-full max-w-lg relative p-6 focus:outline-none`}>
        {title && (
          <h2 id="modal-title" className="text-lg font-semibold mb-4">
            {title}
          </h2>
        )}
        <div className="text-sm sm:text-base">{children}</div>
        {actions && (
          <div className="mt-6 flex justify-end gap-3">{actions}</div>
        )}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 rounded-full px-2 py-1 bg-white/20 border border-white/30 hover:bg-white/30 transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}