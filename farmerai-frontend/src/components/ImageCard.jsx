import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ImageCard({
  src,
  alt,
  title,
  caption,
  href,
  className = "",
  lazy = true,
  priority = false,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  // Handle image loading states
  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
      setImgSrc(src);
    };
    
    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };
  }, [src]);

  const content = (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
      className={`group bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden border-2 border-green-100 border-opacity-60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all ${className}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-4 text-center">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">Image unavailable</div>
          </div>
        )}
        
        {/* Image with enhanced loading */}
        <img
          src={imgSrc}
          alt={alt}
          className={`h-full w-full object-cover transition-all duration-500 ${
            isLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
          }`}
          loading={lazy ? "lazy" : "eager"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
      </div>
      
      <figcaption className="p-4">
        <div className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</div>
        {caption && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{caption}</p>}
      </figcaption>
    </motion.figure>
  );

  if (href) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noreferrer noopener" 
        aria-label={`${title} (opens in new tab)`}
        className="focus:outline-none focus:ring-2 focus:ring-green-500 rounded-2xl block"
      >
        {content}
      </a>
    );
  }
  return (
    <div className="focus:outline-none focus:ring-2 focus:ring-green-500 rounded-2xl">
      {content}
    </div>
  );
}