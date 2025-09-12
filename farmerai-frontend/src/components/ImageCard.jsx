import React from "react";
import { motion } from "framer-motion";

export default function ImageCard({
  src,
  alt,
  title,
  caption,
  href,
  className = "",
}) {
  const content = (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
      className={`group bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden border-2 border-green-100 border-opacity-60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all ${className}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
      </div>
      <figcaption className="p-4">
        <div className="text-base md:text-lg font-semibold text-gray-800">{title}</div>
        {caption && <p className="text-sm text-gray-600 mt-1">{caption}</p>}
      </figcaption>
    </motion.figure>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" aria-label={`${title} (opens in new tab)`}>
        {content}
      </a>
    );
  }
  return content;
}


