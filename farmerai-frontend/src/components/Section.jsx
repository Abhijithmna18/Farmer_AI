import React from "react";
import { motion } from "framer-motion";

export default function Section({ children, className = "", as = "section" }) {
  const Tag = as;
  return (
    <Tag className={className}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </Tag>
  );
}


