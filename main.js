import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createIcons, Monitor, LayoutTemplate, Bot, Sun, Moon, Lightbulb, Palette, Wrench, Rocket, ArrowRight, Menu, X } from 'lucide';

// Initialize Icons
createIcons({
  icons: {
    Monitor,
    LayoutTemplate,
    Bot,
    Sun,
    Moon,
    Lightbulb,
    Palette,
    Wrench,
    Rocket,
    ArrowRight,
    Menu,
    X
  }
});

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

/* --- THREE.JS BACKGROUND SCENE --- */
const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();

// Camera setup for parallax and zoom FX
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

let isDark = true; // Use a mutable variable for Theme Toggle

// Add Particles / Stars
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 2000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 150; // Spread over 150 units space
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: 0.2,
  color: isDark ? 0x3b82f6 : 0x2563eb,
  transparent: true,
  opacity: 0.8,
  blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
scene.add(particlesMesh);

// Add an Abstract Icosahedron Mesh (Wireframe) behind text
const meshGeometry = new THREE.IcosahedronGeometry(15, 2);
const meshMaterial = new THREE.MeshBasicMaterial({
  color: isDark ? 0xffffff : 0x0f172a,
  wireframe: true,
  transparent: true,
  opacity: isDark ? 0.05 : 0.1
});
const abstractMesh = new THREE.Mesh(meshGeometry, meshMaterial);
scene.add(abstractMesh);

/* --- MOBILE MENU LISTENER --- */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navContainer = document.getElementById('nav-container');

if (mobileMenuBtn && navContainer) {
  mobileMenuBtn.addEventListener('click', () => {
    navContainer.classList.toggle('active');
    const isActive = navContainer.classList.contains('active');
    mobileMenuBtn.innerHTML = isActive ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    createIcons({ icons: { Menu, X } });
  });

  // Close menu on link click
  navContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navContainer.classList.remove('active');
      mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
      createIcons({ icons: { Menu } });
    });
  });
}

// Mouse Interaction variables
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY);
});

// Animation Loop
const clock = new THREE.Clock();
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Mouse Parallax Interaction (Smooth Damping)
  targetX = mouseX * 0.001;
  targetY = mouseY * 0.001;

  particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
  particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

  // Auto rotation
  abstractMesh.rotation.y = elapsedTime * 0.1;
  abstractMesh.rotation.x = elapsedTime * 0.05;

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();

// Window Resize Handle
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* --- GSAP ANIMATIONS --- */

// Initial Hero Timeline (Logo Entrance & Captions)
const tl = gsap.timeline();

// Start huge and scale down
tl.fromTo('.logo-text',
  { scale: 2, autoAlpha: 0 },
  { scale: 1, autoAlpha: 1, duration: 2, ease: "power4.out" }
)
  .fromTo('.caption-primary',
    { y: 30, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" },
    "-=1"
  )
  .fromTo('.caption-secondary',
    { y: 30, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" },
    "-=0.7"
  );

// Scroll Zoom Effect (Scroll out of Hero)
ScrollTrigger.create({
  trigger: ".hero-section",
  start: "top top",
  end: "bottom top",
  scrub: 1,
  animation: gsap.to(camera.position, { z: 15, ease: "none" }) // Camera zooms in on scroll
});

// Text Transition away on Scroll
ScrollTrigger.create({
  trigger: ".hero-section",
  start: "top top",
  end: "bottom top",
  scrub: 1,
  animation: gsap.to('.hero-captions', { y: -100, opacity: 0, scale: 0.9, ease: "none" })
});

ScrollTrigger.create({
  trigger: ".hero-section",
  start: "top top",
  end: "bottom top",
  scrub: 2,
  animation: gsap.to('.logo-container', { y: -150, opacity: 0, immediateRender: false, ease: "none" })
});

// Animate Section Titles
gsap.utils.toArray('.section-title').forEach(title => {
  gsap.fromTo(title,
    { autoAlpha: 0, y: 50 },
    {
      autoAlpha: 1, y: 0, duration: 1,
      scrollTrigger: {
        trigger: title,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    }
  );
});

// About Section Process Steps Stagger Entry
gsap.fromTo('.process-step', 
  { autoAlpha: 0, y: 50 },
  {
    autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
    scrollTrigger: {
      trigger: ".process-grid",
      start: "top 85%",
      toggleActions: "play none none reverse"
    }
  }
);

// Portfolio Cards Stagger Entry
gsap.fromTo('.portfolio-card',
  { autoAlpha: 0, y: 100, rotateX: 20 },
  {
    autoAlpha: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.2, ease: "back.out(1.7)",
    scrollTrigger: {
      trigger: ".portfolio-grid",
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  }
);

// Service Items Entry
gsap.fromTo('.service-detail-card',
  { autoAlpha: 0, x: -30 },
  {
    autoAlpha: 1, x: 0, duration: 0.8, stagger: 0.2, ease: "power3.out",
    scrollTrigger: {
      trigger: ".services-list",
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  }
);

/* --- FORM HANDLING --- */
document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn span');
  const glow = e.target.querySelector('.btn-glow');

  // Fake sending state
  btn.innerHTML = 'Sending via Automation...';
  gsap.to(glow, { width: '300%', height: '300%', duration: 0.5 });

  setTimeout(() => {
    btn.innerHTML = 'Request Submitted!';
    e.target.reset();
    setTimeout(() => {
      btn.innerHTML = 'Submit Request';
      gsap.to(glow, { width: 0, height: 0, duration: 0.5 });
    }, 3000);
  }, 1500);
});
