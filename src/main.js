import "./style.css";
import { FluidEffect } from "./effects/fluid/index.js";

// Initialize fluid effect for hero section
const heroCanvas = document.querySelector(".hero__canvas");

if (!heroCanvas) {
  throw new Error(
    "Hero canvas element not found. Make sure the HTML contains a canvas with class 'hero__canvas'."
  );
}

const fluidSimulation = new FluidEffect(heroCanvas);
fluidSimulation.start();

// Smooth scroll navigation
const navigationLinks = document.querySelectorAll(".nav__link");

navigationLinks.forEach((link) => {
  link.addEventListener("click", handleSmoothScroll);
});

function handleSmoothScroll(event) {
  event.preventDefault();

  const targetId = event.target.getAttribute("href");
  const targetSection = document.querySelector(targetId);

  if (!targetSection) {
    return;
  }

  targetSection.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// Scroll-triggered animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const sectionObserver = new IntersectionObserver(
  handleSectionObserver,
  observerOptions
);

function handleSectionObserver(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("section--visible");
    }
  });
}

// Observe all sections for scroll animations
const sections = document.querySelectorAll(".section");
sections.forEach((section) => {
  sectionObserver.observe(section);
});

// Add scroll-triggered animation styles
const animationStyles = `
  .section {
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  
  .section--visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .hero {
    opacity: 1;
    transform: translateY(0);
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);
