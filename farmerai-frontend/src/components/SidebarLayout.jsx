import React, { useEffect, useState } from "react";
import TabNav from "./TabNav";
import { Outlet } from "react-router-dom";

export default function SidebarLayout({ children }) {
  const [open, setOpen] = useState(false);

  // Keep sidebar open on medium+ screens and closed on small screens by default.
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setOpen(true);
      else setOpen(false);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-green-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <TabNav isOpen={open} onToggle={() => setOpen((o) => !o)} />

      {/* Toggle button (visible on all sizes) */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white/80 dark:bg-slate-800/80 text-gray-800 dark:text-slate-200 backdrop-blur rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle sidebar"
        aria-expanded={open}
      >
        {open ? '←' : '☰'}
      </button>

      <main
        className={`flex-1 p-4 md:p-8 transform transition-transform duration-300 ${
          open ? 'md:ml-64 md:translate-x-0' : 'md:ml-64'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
