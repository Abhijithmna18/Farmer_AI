// src/animations/buttonAnim.js
import { useEffect } from "react";
import gsap from "gsap";

export const useButtonAnim = (ref) => {
  useEffect(() => {
    if (!ref.current) return;

    const btn = ref.current;

    const handleEnter = () => {
      gsap.to(btn, {
        scale: 1.03,
        boxShadow: "0 6px 15px rgba(0,0,0,0.2), inset 0 -2px 8px rgba(0,0,0,0.1)",
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleLeave = () => {
      gsap.to(btn, {
        scale: 1,
        boxShadow: "0 4px 8px rgba(0,0,0,0.15), inset 0 -3px 12px rgba(0,0,0,0.1)",
        duration: 0.4,
        ease: "power2.out",
      });
    };

    btn.addEventListener("mouseenter", handleEnter);
    btn.addEventListener("mouseleave", handleLeave);

    return () => {
      btn.removeEventListener("mouseenter", handleEnter);
      btn.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref]);
};
export default useButtonAnim;