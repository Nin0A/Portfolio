/* ============================================================
   PORTFOLIO — main.js
   Stack: GSAP + ScrollTrigger, Lenis smooth scroll
   ============================================================ */

// ─────────────────────────────────────────────
// Grain canvas
// ─────────────────────────────────────────────
function initGrain() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(256, 256);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    imageData.data[i]     = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  document.getElementById('grain').style.backgroundImage = `url(${canvas.toDataURL()})`;
}

// ─────────────────────────────────────────────
// Custom cursor
// ─────────────────────────────────────────────
function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  let raf;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    gsap.set(dot, { x: mouseX, y: mouseY });
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    gsap.set(ring, { x: ringX, y: ringY });
    raf = requestAnimationFrame(animateRing);
  }
  animateRing();

  document.addEventListener('mouseenter', () => document.body.classList.remove('cursor-hidden'));
  document.addEventListener('mouseleave', () => document.body.classList.add('cursor-hidden'));

  document.querySelectorAll('a, button, .project-item, [data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ─────────────────────────────────────────────
// Magnetic buttons
// ─────────────────────────────────────────────
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect   = el.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) * 0.28;
      const dy     = (e.clientY - cy) * 0.28;
      gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

// ─────────────────────────────────────────────
// Smooth scroll (Lenis)
// ─────────────────────────────────────────────
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

// ─────────────────────────────────────────────
// Preloader
// ─────────────────────────────────────────────
function initPreloader() {
  return new Promise((resolve) => {
    const preloader  = document.getElementById('preloader');
    const numEl      = document.getElementById('preloader-num');
    const barEl      = document.querySelector('.preloader-bar');

    let count = 0;
    const duration = 2000;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      count = Math.floor(progress * 100);
      numEl.textContent = String(count).padStart(2, '0');
      barEl.style.width = `${count}%`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        numEl.textContent = '100';
        barEl.style.width = '100%';

        gsap.to(preloader, {
          yPercent: -100,
          duration: 0.9,
          ease: 'power4.inOut',
          delay: 0.2,
          onComplete: () => {
            preloader.style.display = 'none';
            document.body.classList.remove('is-loading');
            resolve();
          }
        });
      }
    }
    requestAnimationFrame(step);
  });
}

// ─────────────────────────────────────────────
// Hero animations (after preloader)
// ─────────────────────────────────────────────
function animateHero() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  tl.to('.hero-line', {
    y: 0,
    duration: 1.1,
    stagger: 0.12,
    ease: 'power4.out',
  })
  .to('.hero-status', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
  .to('.hero-bottom',  { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
  .to('.hero-ticker',  { opacity: 1, duration: 0.6 }, '-=0.3');
}

// ─────────────────────────────────────────────
// Scroll-triggered animations
// ─────────────────────────────────────────────
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  // Scroll progress bar
  ScrollTrigger.create({
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      document.getElementById('scroll-progress').style.width = `${self.progress * 100}%`;
    }
  });

  // Section labels
  gsap.utils.toArray('.section-label').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      duration: 0.8,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // Reveal up — about text, contact CTA
  gsap.utils.toArray('.reveal-up').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      }
    );
  });

  // About stats counter
  gsap.utils.toArray('.stat-item').forEach(item => {
    const numEl  = item.querySelector('.stat-num');
    const target = parseInt(numEl.dataset.target, 10);
    ScrollTrigger.create({
      trigger: item,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(item, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function () {
            numEl.textContent = Math.round(this.targets()[0].val);
          }
        });
      }
    });
  });

  // Skill bars
  gsap.utils.toArray('.skill-item').forEach((item, i) => {
    const bar = item.querySelector('.skill-bar');
    ScrollTrigger.create({
      trigger: item,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        gsap.to(item, { opacity: 1, duration: 0.6, delay: i * 0.07 });
        gsap.to(bar, {
          width: `${bar.dataset.width}%`,
          duration: 1.3,
          delay: i * 0.07 + 0.15,
          ease: 'power3.out'
        });
      }
    });
  });

  // Project items
  gsap.utils.toArray('.project-item').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        delay: i * 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 88%' }
      }
    );
  });
}

// ─────────────────────────────────────────────
// Project preview on hover
// ─────────────────────────────────────────────
function initProjectPreview() {
  const preview  = document.getElementById('project-preview');
  const imgEl    = document.getElementById('preview-img');
  let previewX   = 0, previewY = 0;
  let targetX    = 0, targetY  = 0;
  let isVisible  = false;

  function animate() {
    previewX += (targetX - previewX) * 0.1;
    previewY += (targetY - previewY) * 0.1;
    gsap.set(preview, {
      x: previewX,
      y: previewY,
    });
    requestAnimationFrame(animate);
  }
  animate();

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX + 24;
    targetY = e.clientY - 80;
  });

  document.querySelectorAll('.project-item[data-preview]').forEach(item => {
    const src = item.dataset.preview;

    item.addEventListener('mouseenter', () => {
      imgEl.src = src;
      preview.classList.add('is-visible');
      isVisible = true;
    });

    item.addEventListener('mouseleave', () => {
      preview.classList.remove('is-visible');
      isVisible = false;
    });
  });
}

// ─────────────────────────────────────────────
// Contact form
// ─────────────────────────────────────────────
function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    success.textContent = 'Message envoyé ! Je vous réponds rapidement.';
    success.classList.add('is-visible');
    form.reset();
    setTimeout(() => success.classList.remove('is-visible'), 5000);
  });
}

// ─────────────────────────────────────────────
// Smooth anchor scroll (Lenis-aware)
// ─────────────────────────────────────────────
function initAnchorScroll(lenis) {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    });
  });
}

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Theme switcher
// ─────────────────────────────────────────────
function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.add('theme-transitioning');
  setTimeout(() => root.classList.remove('theme-transitioning'), 400);

  if (theme === 'dark') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  localStorage.setItem('portfolio-theme', theme);

  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.theme === theme);
  });
}

function initThemeSwitcher() {
  const saved = localStorage.getItem('portfolio-theme') || 'dark';
  applyTheme(saved);
  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
}

async function init() {
  initGrain();
  initCursor();
  initThemeSwitcher();

  // Wait for preloader to finish, then reveal hero
  await initPreloader();

  const lenis = initLenis();
  animateHero();
  initScrollAnimations();
  initProjectPreview();
  initMagnetic();
  initContactForm();
  initAnchorScroll(lenis);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
