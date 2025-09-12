import gsap from "gsap";

// Loader animations
document.querySelectorAll('.loader').forEach(loader => {
  gsap.from(loader, {
    opacity: 0,
    y: 20,
    duration: 0.5,
    ease: "power2.out"
  });
  
  const spinner = loader.querySelector('.spinner');
  gsap.to(spinner, {
    rotation: 360,
    duration: 1.5,
    repeat: -1,
    ease: "linear"
  });
  
  const dots = loader.querySelectorAll('.loading-dots span');
  gsap.to(dots, {
    opacity: 0.3,
    yoyo: true,
    repeat: -1,
    stagger: 0.3,
    duration: 0.8,
    ease: "power1.inOut"
  });
});