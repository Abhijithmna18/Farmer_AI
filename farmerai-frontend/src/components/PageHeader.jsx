import React from "react";
import { motion } from "framer-motion";

export default function PageHeader({ title, subtitle, icon = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-6 md:mb-8 p-6 rounded-3xl bg-white/90 backdrop-blur-xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.20)] relative overflow-hidden"
      aria-live="polite"
    >
      <div className="absolute top-0 right-0 w-28 h-28 bg-green-50 rounded-bl-full z-0" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-50 rounded-tr-full z-0" />

      <div className="relative z-10 flex items-start gap-3">
        {icon && (
          <div className="text-3xl md:text-4xl" aria-hidden>
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
              {title}
            </span>
          </h2>
          {subtitle && (
            <p className="text-gray-700 mt-2 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}


