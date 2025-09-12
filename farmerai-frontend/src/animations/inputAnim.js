import gsap from "gsap";

// Input field animations
document.querySelectorAll(".farmerai-input").forEach(input => {
  // Focus animation
  input.addEventListener("focus", () => {
    gsap.to(input, {
      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15), 0 0 0 4px rgba(79, 195, 247, 0.2)",
      duration: 0.3,
      ease: "power2.out"
    });
  });
  
  // Blur animation
  input.addEventListener("blur", () => {
    gsap.to(input, {
      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.05)",
      duration: 0.4,
      ease: "power2.out"
    });
  });
  
  // Hover animation
  input.addEventListener("mouseenter", () => {
    gsap.to(input, {
      y: -1,
      boxShadow: "inset 0 2px 6px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.1)",
      duration: 0.2
    });
  });
  
  input.addEventListener("mouseleave", () => {
    gsap.to(input, {
      y: 0,
      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.05)",
      duration: 0.3
    });
  });
});