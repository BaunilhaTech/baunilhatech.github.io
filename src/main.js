import "./style.css";
import { FluidEffect } from "./effects/fluid/index.js";
import { Rive } from "@rive-app/webgl2";

const heroCanvas = document.querySelector(".hero__canvas");

if (!heroCanvas) {
  throw new Error(
    "Hero canvas element not found. Make sure the HTML contains a canvas with class 'hero__canvas'."
  );
}

const fluidSimulation = new FluidEffect(heroCanvas);
fluidSimulation.start();

const footerCanvas = document.querySelector(".footer__canvas");

if (footerCanvas) {
  const footerFluidSimulation = new FluidEffect(footerCanvas);
  footerFluidSimulation.start();
}

// Inicializar animação Rive
const riveCanvas = document.querySelector("#rive-canvas");

// Função para configurar interatividade com mouse
function setupInteractivity(riveInstance, canvas, stateMachineName) {
  console.log(
    `🎮 Configurando interatividade para state machine: ${stateMachineName}`
  );

  try {
    const inputs = riveInstance.stateMachineInputs(stateMachineName);

    if (!inputs || inputs.length === 0) {
      console.log("ℹ️  Nenhum input encontrado na state machine");
      return;
    }

    console.log(
      "🎯 Inputs encontrados:",
      inputs.map((i) => `${i.name} (${i.type})`)
    );

    // Procurar por inputs comuns de mouse
    const hoverInput = inputs.find(
      (i) =>
        i.name.toLowerCase().includes("hover") ||
        i.name.toLowerCase().includes("mouse")
    );

    const clickInput = inputs.find(
      (i) =>
        i.name.toLowerCase().includes("click") ||
        i.name.toLowerCase().includes("trigger") ||
        i.name.toLowerCase().includes("tap")
    );

    const positionXInput = inputs.find(
      (i) =>
        i.name.toLowerCase().includes("x") ||
        i.name.toLowerCase().includes("posx")
    );

    const positionYInput = inputs.find(
      (i) =>
        i.name.toLowerCase().includes("y") ||
        i.name.toLowerCase().includes("posy")
    );

    // Configurar eventos de hover
    if (hoverInput) {
      console.log(`✅ Configurando hover input: ${hoverInput.name}`);
      canvas.addEventListener("mouseenter", () => {
        if (hoverInput.type === "Boolean") {
          hoverInput.value = true;
        }
      });

      canvas.addEventListener("mouseleave", () => {
        if (hoverInput.type === "Boolean") {
          hoverInput.value = false;
        }
      });
    }

    // Configurar eventos de click
    if (clickInput) {
      console.log(`✅ Configurando click input: ${clickInput.name}`);
      canvas.addEventListener("click", () => {
        if (clickInput.type === "Trigger") {
          clickInput.fire();
        } else if (clickInput.type === "Boolean") {
          clickInput.value = !clickInput.value;
        }
      });
    }

    // Configurar posição do mouse
    if (positionXInput || positionYInput) {
      console.log(
        `✅ Configurando mouse position - X: ${positionXInput?.name}, Y: ${positionYInput?.name}`
      );
      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100; // 0-100
        const y = ((event.clientY - rect.top) / rect.height) * 100; // 0-100

        if (positionXInput && positionXInput.type === "Number") {
          positionXInput.value = x;
        }

        if (positionYInput && positionYInput.type === "Number") {
          positionYInput.value = y;
        }
      });
    }

    // Se não encontrar inputs específicos, listar todos para debug
    if (!hoverInput && !clickInput && !positionXInput && !positionYInput) {
      console.log("🔍 Inputs disponíveis para configuração manual:");
      inputs.forEach((input) => {
        console.log(`- ${input.name} (tipo: ${input.type})`);
      });
    }
  } catch (error) {
    console.error("❌ Erro ao configurar interatividade:", error);
  }
}

if (riveCanvas) {
  console.log("Canvas encontrado, carregando Rive...");

  // Verificar se o arquivo existe primeiro
  fetch("/neomorph_001.riv")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Arquivo não encontrado: ${response.status}`);
      }
      console.log("✅ Arquivo .riv encontrado, carregando...");

      const riveInstance = new Rive({
        src: "/neomorph_001.riv",
        canvas: riveCanvas,
        autoplay: true,
        useOffscreenRenderer: true,
        stateMachines: "State Machine 1", // Vamos especificar a state machine
        onLoad: () => {
          console.log("✅ Animação Rive carregada com sucesso!");
          riveInstance.resizeDrawingSurfaceToCanvas();

          // Configurar interatividade diretamente
          setupInteractivity(riveInstance, riveCanvas, "State Machine 1");
        },
        onLoadError: (error) => {
          console.error("❌ Erro ao carregar animação Rive:", error);
        },
        onPlay: () => {
          console.log("▶️ Animação iniciada");
        },
        onPause: () => {
          console.log("⏸️ Animação pausada");
        },
      });

      // Redimensionar quando a janela mudar de tamanho
      window.addEventListener("resize", () => {
        if (riveInstance) {
          riveInstance.resizeDrawingSurfaceToCanvas();
        }
      });

      // Cleanup quando a página for descarregada
      window.addEventListener("beforeunload", () => {
        if (riveInstance) {
          riveInstance.cleanup();
        }
      });
    })
    .catch((error) => {
      console.error("❌ Erro ao verificar arquivo .riv:", error);
    });
} else {
  console.error("❌ Canvas #rive-canvas não encontrado!");
}

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

  // Fechar menu mobile se estiver aberto
  const mobileMenu = document.querySelector(".nav__menu");
  const hamburger = document.querySelector(".nav__hamburger");

  if (mobileMenu && hamburger) {
    mobileMenu.classList.remove("nav__menu--active");
    hamburger.classList.remove("nav__hamburger--active");
  }

  targetSection.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function initializeMobileMenu() {
  const hamburger = document.querySelector(".nav__hamburger");
  const mobileMenu = document.querySelector(".nav__menu");

  if (!hamburger || !mobileMenu) {
    return;
  }

  hamburger.addEventListener("click", toggleMobileMenu);

  // Fechar menu ao clicar fora dele
  document.addEventListener("click", (event) => {
    const isClickInsideNav = event.target.closest(".nav");

    if (
      !isClickInsideNav &&
      mobileMenu.classList.contains("nav__menu--active")
    ) {
      closeMobileMenu();
    }
  });

  // Fechar menu ao redimensionar para desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
  });
}

function toggleMobileMenu() {
  const hamburger = document.querySelector(".nav__hamburger");
  const mobileMenu = document.querySelector(".nav__menu");

  if (!hamburger || !mobileMenu) {
    return;
  }

  const isActive = mobileMenu.classList.contains("nav__menu--active");

  if (isActive) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function openMobileMenu() {
  const hamburger = document.querySelector(".nav__hamburger");
  const mobileMenu = document.querySelector(".nav__menu");

  if (hamburger && mobileMenu) {
    hamburger.classList.add("nav__hamburger--active");
    mobileMenu.classList.add("nav__menu--active");
    document.body.style.overflow = "hidden";
  }
}

function closeMobileMenu() {
  const hamburger = document.querySelector(".nav__hamburger");
  const mobileMenu = document.querySelector(".nav__menu");

  if (hamburger && mobileMenu) {
    hamburger.classList.remove("nav__hamburger--active");
    mobileMenu.classList.remove("nav__menu--active");
    document.body.style.overflow = "";
  }
}

function configureMobileFluidEffect() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile && heroCanvas && fluidSimulation) {
    // Manter o efeito fluido completo no mobile, apenas restringir as zonas de touch
    heroCanvas.style.touchAction = "none";
  }
}

function initializeScrollZones() {
  const heroScrollZone = document.querySelector(".hero__scroll-zone");
  const footerScrollZone = document.querySelector(".footer__scroll-zone");

  if (!heroScrollZone || !footerScrollZone) return;

  // Função para scroll suave para a próxima seção
  function scrollToNextSection() {
    const aboutSection = document.querySelector("#about");
    if (aboutSection) {
      aboutSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  // Função para scroll suave para a seção anterior
  function scrollToPreviousSection() {
    const sections = ["#home", "#about", "#services", "#contact"];
    const currentScrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    // Se estivermos no footer (próximo ao final da página), ir para contato
    if (currentScrollY > docHeight - windowHeight * 1.2) {
      const contactSection = document.querySelector("#contact");
      if (contactSection) {
        contactSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      return;
    }

    // Determinar qual seção estamos atualmente
    let currentSectionIndex = -1;

    for (let i = 0; i < sections.length; i++) {
      const section = document.querySelector(sections[i]);
      if (section) {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;

        if (
          currentScrollY >= sectionTop - windowHeight * 0.5 &&
          currentScrollY < sectionBottom - windowHeight * 0.5
        ) {
          currentSectionIndex = i;
          break;
        }
      }
    }

    // Navegar para a seção anterior
    let targetSectionIndex = Math.max(0, currentSectionIndex - 1);

    // Se não conseguimos determinar a seção atual, ir para contato
    if (currentSectionIndex === -1) {
      targetSectionIndex = sections.length - 1; // Vai para a última seção (#contact)
    }

    const targetSection = document.querySelector(sections[targetSectionIndex]);
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  // Event listeners para as zonas de scroll
  heroScrollZone.addEventListener("click", scrollToNextSection);
  heroScrollZone.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      scrollToNextSection();
    },
    { passive: false }
  );

  footerScrollZone.addEventListener("click", scrollToPreviousSection);
  footerScrollZone.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      scrollToPreviousSection();
    },
    { passive: false }
  );

  // Adicionar feedback visual ao tocar
  [heroScrollZone, footerScrollZone].forEach((zone) => {
    zone.addEventListener("touchstart", () => {
      zone.style.background = zone.classList.contains("hero__scroll-zone")
        ? "linear-gradient(transparent, rgba(244, 208, 63, 0.3))"
        : "linear-gradient(rgba(244, 208, 63, 0.3), transparent)";
    });

    zone.addEventListener("touchend", () => {
      setTimeout(() => {
        zone.style.background = zone.classList.contains("hero__scroll-zone")
          ? "linear-gradient(transparent, rgba(0, 0, 0, 0.8))"
          : "linear-gradient(rgba(0, 0, 0, 0.8), transparent)";
      }, 200);
    });
  });
}

function initializeFluidScrollZones() {
  const isMobile = () => window.innerWidth <= 768;

  if (!isMobile()) return;

  const heroCanvas = document.querySelector(".hero__canvas");
  const footerCanvas = document.querySelector(".footer__canvas");
  const heroScrollZone = document.querySelector(".hero__scroll-zone");
  const footerScrollZone = document.querySelector(".footer__scroll-zone");

  // Criar máscaras para evitar interferência do efeito fluido nas zonas de scroll
  if (heroCanvas && heroScrollZone) {
    heroCanvas.addEventListener("touchstart", (e) => {
      const rect = heroCanvas.getBoundingClientRect();
      const touchY = e.touches[0].clientY - rect.top;
      const canvasHeight = rect.height;

      // Se o toque for na zona inferior (últimos 120px), não processar o efeito fluido
      if (touchY > canvasHeight - 120) {
        e.stopPropagation();
        return;
      }
    });
  }

  if (footerCanvas && footerScrollZone) {
    footerCanvas.addEventListener("touchstart", (e) => {
      const rect = footerCanvas.getBoundingClientRect();
      const touchY = e.touches[0].clientY - rect.top;

      // Se o toque for na zona superior (primeiros 120px), não processar o efeito fluido
      if (touchY < 120) {
        e.stopPropagation();
        return;
      }
    });
  }
}

function initializeScrollIndicator() {
  const scrollIndicator = document.querySelector(".hero__scroll-indicator");

  if (!scrollIndicator) return;

  let hasScrolled = false;

  function hideScrollIndicator() {
    if (!hasScrolled) {
      hasScrolled = true;
      scrollIndicator.style.opacity = "0";
      scrollIndicator.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => {
        scrollIndicator.style.display = "none";
      }, 300);
    }
  }

  // Esconder ao fazer scroll
  window.addEventListener("scroll", hideScrollIndicator, { once: true });

  // Esconder ao tocar na tela (interação)
  document.addEventListener("touchstart", hideScrollIndicator, { once: true });

  // Mostrar novamente se a página for recarregada e estivermos no topo
  window.addEventListener("load", () => {
    if (window.scrollY === 0 && window.innerWidth <= 768) {
      scrollIndicator.style.display = "flex";
      scrollIndicator.style.opacity = "0.8";
      scrollIndicator.style.transform = "translateX(-50%) translateY(0)";
      hasScrolled = false;
    }
  });
}

function initializeScrollZoneVisibility() {
  const heroScrollZone = document.querySelector(".hero__scroll-zone");
  const footerScrollZone = document.querySelector(".footer__scroll-zone");

  if (!heroScrollZone || !footerScrollZone) return;

  function updateScrollZoneVisibility() {
    const isMobile = window.innerWidth <= 768;
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (!isMobile) {
      heroScrollZone.style.display = "none";
      footerScrollZone.style.display = "none";
      return;
    }

    // Mostrar zona de scroll do hero apenas se estivermos na seção hero
    if (scrollY < windowHeight * 0.8) {
      heroScrollZone.style.display = "block";
    } else {
      heroScrollZone.style.display = "none";
    }

    // Mostrar zona de scroll do footer apenas se estivermos próximos do final
    if (scrollY > docHeight - windowHeight * 1.5) {
      footerScrollZone.style.display = "block";
    } else {
      footerScrollZone.style.display = "none";
    }
  }

  // Atualizar na inicialização e no scroll
  updateScrollZoneVisibility();
  window.addEventListener("scroll", updateScrollZoneVisibility);
  window.addEventListener("resize", updateScrollZoneVisibility);
}

// Auto-hide navigation
let lastScrollY = 0;
let scrollDirection = "up";
let scrollTimeout = null;

function initializeAutoHideNavigation() {
  const nav = document.querySelector(".nav");

  if (!nav) return;

  let isScrolling = false;

  function handleScroll() {
    if (!isScrolling) {
      window.requestAnimationFrame(updateNavigation);
      isScrolling = true;
    }
  }

  function updateNavigation() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    // Don't hide nav at the very top
    if (currentScrollY <= 10) {
      nav.classList.remove("nav--hidden");
      nav.classList.add("nav--visible");
      lastScrollY = currentScrollY;
      isScrolling = false;
      return;
    }

    // Determine scroll direction with threshold to avoid jitter
    if (Math.abs(scrollDelta) > 5) {
      if (scrollDelta > 0) {
        scrollDirection = "down";
      } else {
        scrollDirection = "up";
      }
    }

    // Show/hide navigation based on scroll direction
    if (scrollDirection === "down") {
      nav.classList.add("nav--hidden");
      nav.classList.remove("nav--visible");
    } else {
      nav.classList.remove("nav--hidden");
      nav.classList.add("nav--visible");
    }

    lastScrollY = currentScrollY;
    isScrolling = false;

    // Clear any existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Show nav after scroll stops for better UX
    scrollTimeout = setTimeout(() => {
      nav.classList.remove("nav--hidden");
      nav.classList.add("nav--visible");
    }, 1500);
  }

  // Use passive listener for better performance
  window.addEventListener("scroll", handleScroll, { passive: true });

  // Show nav on mouse movement near top
  document.addEventListener("mousemove", (event) => {
    if (event.clientY <= 100) {
      nav.classList.remove("nav--hidden");
      nav.classList.add("nav--visible");
    }
  });

  // Always show nav when mobile menu is open
  const hamburger = document.querySelector(".nav__hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      nav.classList.remove("nav--hidden");
      nav.classList.add("nav--visible");
    });
  }
}

// Inicializar funcionalidades
initializeMobileMenu();
configureMobileFluidEffect();
initializeScrollZones();
initializeScrollZoneVisibility();
initializeFluidScrollZones();
initializeAutoHideNavigation();

// Reconfigurar em mudanças de viewport
window.addEventListener("resize", () => {
  configureMobileFluidEffect();
  initializeFluidScrollZones();
});

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

const sections = document.querySelectorAll(".section");
sections.forEach((section) => {
  sectionObserver.observe(section);
});

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

// Initialize all functionality when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  initializeMobileMenu();
  initializeScrollZones();
  initializeAutoHideNavigation();
});
