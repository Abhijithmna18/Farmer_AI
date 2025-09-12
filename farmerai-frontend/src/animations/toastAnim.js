import gsap from "gsap";

// Toast entrance animation
gsap.from(".farmerai-toast", {
  x: 100,
  opacity: 0,
  duration: 0.5,
  ease: "back.out(1.2)",
  stagger: 0.1
});

// Toast exit animation (when dismissing)
document.querySelectorAll(".farmerai-toast button").forEach(button => {
  button.addEventListener("click", function() {
    gsap.to(this.closest(".farmerai-toast"), {
      x: 100,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        // Remove element from DOM after animation
        this.closest(".farmerai-toast").remove();
      }
    });
  });
});