/* ============================================================
   PORTFOLIO — main.js
   Stack: Three.js · GSAP ScrollTrigger · Lenis
   ============================================================ */

// ─────────────────────────────────────────────
// Grain canvas
// ─────────────────────────────────────────────
function initGrain() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = img.data[i+1] = img.data[i+2] = v;
    img.data[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  document.getElementById('grain').style.backgroundImage = `url(${canvas.toDataURL()})`;
}

// ─────────────────────────────────────────────
// Custom cursor + trail
// ─────────────────────────────────────────────
function initCursor() {
  // Custom cursor removed — using native browser cursor
}

// ─────────────────────────────────────────────
// Three.js Hero — wireframe icosahedra + particles
// ─────────────────────────────────────────────
let threeScene = null;

function initThreeHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return null;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  // Read --accent CSS variable as Three.js Color
  function accentColor() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim();
    try { return new THREE.Color(raw); } catch { return new THREE.Color('#4da6ff'); }
  }

  // ── Large wireframe icosahedron (right side) ──────────────
  const icoA = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 1),
    new THREE.MeshBasicMaterial({ color: accentColor(), wireframe: true, transparent: true, opacity: 0.08 })
  );
  icoA.position.set(3.5, 0.8, -1);
  scene.add(icoA);

  // ── Small icosahedron (left side) ─────────────────────────
  const icoB = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 1),
    new THREE.MeshBasicMaterial({ color: accentColor(), wireframe: true, transparent: true, opacity: 0.06 })
  );
  icoB.position.set(-4.5, -1.5, -2);
  scene.add(icoB);

  // ── Tiny icosahedron (floating accent) ────────────────────
  const icoC = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.MeshBasicMaterial({ color: accentColor(), wireframe: true, transparent: true, opacity: 0.35 })
  );
  icoC.position.set(-1.5, 2, 1);
  scene.add(icoC);

  // ── Floating particles ────────────────────────────────────
  const COUNT = 90;
  const pPos  = new Float32Array(COUNT * 3);
  const pVel  = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 18;
    pPos[i*3+1] = (Math.random() - 0.5) * 12;
    pPos[i*3+2] = (Math.random() - 0.5) *  5;
    pVel[i*3]   = (Math.random() - 0.5) * 0.0025;
    pVel[i*3+1] = (Math.random() - 0.5) * 0.0018;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.04, color: accentColor(), transparent: true, opacity: 0.55 });
  const pts  = new THREE.Points(pGeo, pMat);
  scene.add(pts);

  // ── Mouse parallax ────────────────────────────────────────
  let targetMX = 0, targetMY = 0, camX = 0, camY = 0;
  document.addEventListener('mousemove', e => {
    targetMX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Render loop ───────────────────────────────────────────
  (function animate() {
    requestAnimationFrame(animate);

    icoA.rotation.x += 0.0025; icoA.rotation.y += 0.004;
    icoB.rotation.x -= 0.003;  icoB.rotation.y -= 0.002;
    icoC.rotation.x += 0.006;  icoC.rotation.z += 0.004;

    // Drift particles + wrap
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      arr[i*3]   += pVel[i*3];
      arr[i*3+1] += pVel[i*3+1];
      if (arr[i*3]    >  9) arr[i*3]    = -9;
      if (arr[i*3]    < -9) arr[i*3]    =  9;
      if (arr[i*3+1]  >  6) arr[i*3+1]  = -6;
      if (arr[i*3+1]  < -6) arr[i*3+1]  =  6;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Smooth camera parallax
    camX += (targetMX * 0.55 - camX) * 0.04;
    camY += (targetMY * -0.35 - camY) * 0.04;
    camera.position.x = camX;
    camera.position.y = camY;
    // Pull back slightly on scroll (zoom-out parallax)
    camera.position.z = 7 + scrollY * 0.004;

    renderer.render(scene, camera);
  })();

  // ── Update colors on theme change ─────────────────────────
  function updateColors() {
    const c = accentColor();
    [icoA, icoB, icoC].forEach(m => { m.material.color = c; });
    pMat.color = c;
  }

  return { updateColors };
}

// ─────────────────────────────────────────────
// Parallax — hero layers at different depths
// ─────────────────────────────────────────────
function initParallax() {
  // Title block moves up faster than page (depth illusion)
  gsap.to('.hero-title-wrap', {
    yPercent: -22,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
  });

  // Bottom info moves slower → different depth
  gsap.to('.hero-bottom', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.6 }
  });

  // Status badge drifts up and fades
  gsap.to('.hero-status', {
    yPercent: -55,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '50% top', scrub: 1 }
  });

  // Section titles slide in with slight stagger depth
  gsap.utils.toArray('.section-label').forEach((el, i) => {
    gsap.from(el, {
      x: -30,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 60%', scrub: 1 }
    });
  });

  // Stat numbers have slight parallax lag
  gsap.utils.toArray('.stat-item').forEach((el, i) => {
    gsap.from(el, {
      y: 40 + i * 15,
      ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top 80%', end: 'top 30%', scrub: true }
    });
  });
}

// ─────────────────────────────────────────────
// Text scramble — characters cycle through glyphs before resolving
// ─────────────────────────────────────────────
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!?';

function scramble(el, duration = 460) {
  const original = el.dataset.original || el.textContent;
  if (!el.dataset.original) el.dataset.original = original;
  let raf = null, t0 = null;

  function tick(ts) {
    if (!t0) t0 = ts;
    const p = Math.min((ts - t0) / duration, 1);
    const revealed = Math.floor(p * original.length);
    el.textContent = [...original].map((ch, i) => {
      if (i < revealed || ch === ' ') return ch;
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }).join('');
    if (p < 1) raf = requestAnimationFrame(tick);
    else el.textContent = original;
  }

  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
  return () => { if (raf) cancelAnimationFrame(raf); el.textContent = original; };
}

// ─────────────────────────────────────────────
// Project interactions — scramble + cursor bubble + spotlight
// ─────────────────────────────────────────────
function initProjectInteractions() {
  const label = document.getElementById('cursor-label');

  document.querySelectorAll('.project-item').forEach(item => {
    const nameEl = item.querySelector('.project-name');
    let stopScramble = null;

    item.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-project');
      if (label) label.textContent = 'VOIR';
      if (nameEl) stopScramble = scramble(nameEl);
    });

    item.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-project');
      if (stopScramble) { stopScramble(); stopScramble = null; }
    });

    // Drive the radial spotlight via CSS custom properties
    item.addEventListener('mousemove', e => {
      const r = item.getBoundingClientRect();
      item.style.setProperty('--sx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      item.style.setProperty('--sy', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    });
  });
}

// ─────────────────────────────────────────────
// Ticker — GSAP rAF loop: seamless, no CSS-reset flicker, scroll-velocity aware
// ─────────────────────────────────────────────
function initTicker() {
  const wrap  = document.querySelector('.hero-ticker');
  const track = document.querySelector('.ticker-track');
  if (!track) return;

  track.style.animation = 'none';

  let x = 0, lastSY = 0, scrollV = 0;
  let targetSpeed = 0.65, curSpeed = 0.65;

  window.addEventListener('scroll', () => {
    scrollV = window.scrollY - lastSY;
    lastSY  = window.scrollY;
  }, { passive: true });

  if (wrap) {
    wrap.addEventListener('mouseenter', () => { targetSpeed = 0.08; });
    wrap.addEventListener('mouseleave',  () => { targetSpeed = 0.65; });
  }

  // One frame delay so scrollWidth is accurate after paint
  requestAnimationFrame(() => {
    const halfW = track.scrollWidth / 2;
    // `pos` accumulates freely; `pos % halfW` gives the seamless visual offset
    // — no reset jump, no rounding artifact, sub-pixel accurate
    gsap.ticker.add(() => {
      curSpeed += (targetSpeed - curSpeed) * 0.06;
      const speed = curSpeed + Math.abs(scrollV) * 0.055;
      scrollV *= 0.87;
      x -= speed;
      gsap.set(track, { x: x % halfW }); // modulo keeps range (-halfW, 0]
    });
  });
}

// ─────────────────────────────────────────────
// Hero char split — wraps each character in a span for stagger animation
// ─────────────────────────────────────────────
function splitHeroChars() {
  document.querySelectorAll('.hero-line').forEach(line => {
    const fragments = [];
    line.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        [...node.textContent].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'hero-char';
          s.style.display = 'inline-block';
          s.textContent = ch === ' ' ? ' ' : ch;
          fragments.push(s);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const wrapper = node.cloneNode(false);
        [...node.textContent].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'hero-char';
          s.style.display = 'inline-block';
          s.textContent = ch === ' ' ? ' ' : ch;
          wrapper.appendChild(s);
        });
        fragments.push(wrapper);
      }
    });
    line.innerHTML = '';
    fragments.forEach(f => line.appendChild(f));
  });
}

// ─────────────────────────────────────────────
// Nav split text — dual-layer SVG clipPath technique
// Primary nav: dark text (#111111) for light backgrounds
// Clone nav:   light text (#f0ece4) clipped to dark-bg regions
// Produces per-pixel, per-character color splitting at section boundaries
// ─────────────────────────────────────────────
function initNavSplitText() {
  const nav = document.getElementById('nav');

  // ── SVG clipPath ──────────────────────────────────────────
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:0';
  const defs = document.createElementNS(svgNS, 'defs');
  const clipPath = document.createElementNS(svgNS, 'clipPath');
  clipPath.id = 'nav-dark-clip';
  clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
  const clipRect = document.createElementNS(svgNS, 'rect');
  clipRect.setAttribute('x', '0');
  clipRect.setAttribute('y', '0');
  clipRect.setAttribute('width', String(window.innerWidth));
  clipRect.setAttribute('height', '0');
  clipPath.appendChild(clipRect);
  defs.appendChild(clipPath);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  // ── Clone nav ─────────────────────────────────────────────
  const clone = nav.cloneNode(true);
  clone.id = 'nav-clone';
  clone.setAttribute('aria-hidden', 'true');
  // Replicate fixed layout since #nav CSS won't apply to #nav-clone
  clone.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0',
    'height:var(--nav-h)', 'display:flex', 'align-items:center',
    'justify-content:space-between', 'padding:0 var(--pad-x)',
    'z-index:900', 'pointer-events:none',
    'clip-path:url(#nav-dark-clip)'
  ].join(';');
  nav.insertAdjacentElement('afterend', clone);

  // ── Luminance — walks up DOM to find first opaque background ─
  function sectionLuminance(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/[\d.]+/g);
      if (m && m.length >= 3 && parseFloat(m[3] ?? '1') > 0.05) {
        return (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255;
      }
      node = node.parentElement;
    }
    // Fallback: parse --bg hex
    const hex = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg').trim().replace(/\s/g, '');
    if (/^#[0-9a-f]{6}/i.test(hex)) {
      return (0.299 * parseInt(hex.slice(1, 3), 16)
            + 0.587 * parseInt(hex.slice(3, 5), 16)
            + 0.114 * parseInt(hex.slice(5, 7), 16)) / 255;
    }
    return 0;
  }

  const sections = Array.from(document.querySelectorAll('#hero, .section, #footer'));

  function update() {
    const h = nav.offsetHeight;
    let darkY0 = Infinity, darkY1 = -Infinity;

    for (const sec of sections) {
      if (sectionLuminance(sec) > 0.55) continue; // light section — skip
      const r = sec.getBoundingClientRect();
      const top = Math.max(0, r.top);
      const bot = Math.min(h, r.bottom);
      if (bot > top) {
        if (top < darkY0) darkY0 = top;
        if (bot > darkY1) darkY1 = bot;
      }
    }

    clipRect.setAttribute('width', String(window.innerWidth));
    if (darkY1 > darkY0) {
      clipRect.setAttribute('y', String(darkY0));
      clipRect.setAttribute('height', String(darkY1 - darkY0));
    } else {
      clipRect.setAttribute('height', '0');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
  return update;
}

// ─────────────────────────────────────────────
// Magnetic buttons
// ─────────────────────────────────────────────
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r  = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) * 0.28;
      const dy = (e.clientY - r.top  - r.height / 2) * 0.28;
      gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

// ─────────────────────────────────────────────
// Smooth scroll (Lenis)
// ─────────────────────────────────────────────
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

// ─────────────────────────────────────────────
// Preloader
// ─────────────────────────────────────────────
function initPreloader() {
  return new Promise(resolve => {
    const el  = document.getElementById('preloader');
    const num = document.getElementById('preloader-num');
    const bar = document.querySelector('.preloader-bar');
    const dur = 2000, t0 = performance.now();

    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      num.textContent = String(Math.floor(p * 100)).padStart(2, '0');
      bar.style.width = `${p * 100}%`;
      if (p < 1) { requestAnimationFrame(step); return; }
      num.textContent = '100';
      gsap.to(el, {
        yPercent: -100, duration: 0.9, ease: 'power4.inOut', delay: 0.2,
        onComplete() {
          el.style.display = 'none';
          document.body.classList.remove('is-loading');
          resolve();
        }
      });
    })(t0);
  });
}

// ─────────────────────────────────────────────
// Hero entrance
// ─────────────────────────────────────────────
function animateHero() {
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to('.hero-line', { y: 0, duration: 1.1, stagger: 0.12 })
    .from('.hero-char', {
      opacity: 0, y: 12,
      duration: 0.55, stagger: { amount: 0.45 },
      ease: 'power3.out'
    }, '-=1.0')
    .to('.hero-status', { opacity: 1, duration: 0.7 }, '-=0.25')
    .to('.hero-bottom', { opacity: 1, duration: 0.7 }, '-=0.4')
    .to('.hero-ticker', { opacity: 1, duration: 0.6 }, '-=0.3');
}

// ─────────────────────────────────────────────
// Scroll-triggered reveal animations
// ─────────────────────────────────────────────
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  // Scroll progress bar
  ScrollTrigger.create({
    start: 'top top', end: 'bottom bottom',
    onUpdate: self => {
      document.getElementById('scroll-progress').style.width = `${self.progress * 100}%`;
    }
  });

  // Section labels
  gsap.utils.toArray('.section-label').forEach(el => {
    gsap.to(el, { opacity: 1, duration: 0.8,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // Reveal up
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      }
    );
  });

  // Stats counter
  gsap.utils.toArray('.stat-item').forEach(item => {
    const numEl  = item.querySelector('.stat-num');
    const target = parseInt(numEl.dataset.target, 10);
    ScrollTrigger.create({
      trigger: item, start: 'top 80%', once: true,
      onEnter() {
        gsap.to(item, { opacity: 1, duration: 0.8, ease: 'power3.out' });
        gsap.to({ val: 0 }, {
          val: target, duration: 1.6, ease: 'power2.out',
          onUpdate() { numEl.textContent = Math.round(this.targets()[0].val); }
        });
      }
    });
  });

  // Skill bars
  gsap.utils.toArray('.skill-item').forEach((item, i) => {
    const bar = item.querySelector('.skill-bar');
    ScrollTrigger.create({
      trigger: item, start: 'top 86%', once: true,
      onEnter() {
        gsap.to(item, { opacity: 1, duration: 0.6, delay: i * 0.07 });
        gsap.to(bar,  { width: `${bar.dataset.width}%`, duration: 1.3,
          delay: i * 0.07 + 0.15, ease: 'power3.out' });
      }
    });
  });

  // Project items
  gsap.utils.toArray('.project-item').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.7, delay: i * 0.09, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 88%' }
      }
    );
  });
}

// ─────────────────────────────────────────────
// Project hover preview (floating card)
// ─────────────────────────────────────────────
function initProjectPreview() {
  const preview = document.getElementById('project-preview');
  const imgEl   = document.getElementById('preview-img');
  let px = 0, py = 0, tx = 0, ty = 0;

  (function animate() {
    px += (tx - px) * 0.1;
    py += (ty - py) * 0.1;
    gsap.set(preview, { x: px, y: py });
    requestAnimationFrame(animate);
  })();

  document.addEventListener('mousemove', e => { tx = e.clientX + 24; ty = e.clientY - 80; });

  document.querySelectorAll('.project-item[data-preview]').forEach(item => {
    item.addEventListener('mouseenter', () => {
      imgEl.src = item.dataset.preview;
      preview.classList.add('is-visible');
    });
    item.addEventListener('mouseleave', () => preview.classList.remove('is-visible'));
  });
}

// ─────────────────────────────────────────────
// Theme switcher
// ─────────────────────────────────────────────
let _navUpdate = null;

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.add('theme-transitioning');
  setTimeout(() => root.classList.remove('theme-transitioning'), 400);

  theme === 'dark'
    ? root.removeAttribute('data-theme')
    : root.setAttribute('data-theme', theme);

  localStorage.setItem('portfolio-theme', theme);

  document.querySelectorAll('.theme-dot').forEach(b =>
    b.classList.toggle('is-active', b.dataset.theme === theme)
  );

  // Update Three.js colors + nav color
  if (threeScene) requestAnimationFrame(threeScene.updateColors);
  if (_navUpdate)  requestAnimationFrame(_navUpdate);
}

function initThemeSwitcher() {
  const saved = localStorage.getItem('portfolio-theme') || 'dark';
  applyTheme(saved);
  document.querySelectorAll('.theme-dot').forEach(btn =>
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme))
  );
}

// ─────────────────────────────────────────────
// Contact form
// ─────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  const msg  = document.getElementById('form-success');
  form.addEventListener('submit', e => {
    e.preventDefault();
    msg.textContent = 'Message envoyé ! Je vous réponds rapidement.';
    msg.classList.add('is-visible');
    form.reset();
    setTimeout(() => msg.classList.remove('is-visible'), 5000);
  });
}

// ─────────────────────────────────────────────
// Anchor scroll (Lenis-aware)
// ─────────────────────────────────────────────
function initAnchorScroll(lenis) {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(link.getAttribute('href'));
      if (t) lenis.scrollTo(t, { offset: -72, duration: 1.4 });
    });
  });
}

// ─────────────────────────────────────────────
// Canvas — infrastructure réseau / IP game
// ─────────────────────────────────────────────
function initCanvasSection() {
  const wrapper   = document.getElementById('canvas-wrapper');
  const canvas    = document.getElementById('infinite-canvas');
  const nodesDiv  = document.getElementById('canvas-nodes');
  const ipcModal  = document.getElementById('ip-cfg');
  const apsModal  = document.getElementById('app-store');
  if (!wrapper || !canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Block definitions ──────────────────────────────────────
     end/srv = sources (no input port; need IP+GW to go online)
     lan     = switch (4 input ports max, L2 transparent)
     net/sec = routing layer (need LAN IP + WAN IP configured)
     wan     = internet exit (fixed IPs, always reachable)
     Revenue = apps on online nodes × security/datacenter multiplier
  ─────────────────────────────────────────────────────────── */
  const DEFS = {
    pc:         { icon:'💻', name:'Poste PC',     cat:'end', col:[96,165,250],  cost:0,    unlocked:true,  accepts:null,              desc:'Installe des apps pour gagner 💰' },
    switch_:    { icon:'🔌', name:'Switch',       cat:'lan', col:[52,211,153],  cost:100,  unlocked:true,  accepts:['end','srv','lan'],desc:'4 ports · relie le LAN' },
    routeur:    { icon:'📡', name:'Routeur',      cat:'net', col:[167,139,250], cost:300,  unlocked:true,  accepts:['end','lan','srv'],desc:'Configure IP LAN + WAN' },
    fai:        { icon:'☁️', name:'FAI / Cloud', cat:'wan', col:[251,191,36],  cost:150,  unlocked:true,  accepts:['net','sec'],      desc:'Accès internet · 1.1.1.1' },
    firewall:   { icon:'🛡️', name:'Pare-feu',   cat:'sec', col:[249,115,22],  cost:800,  unlocked:false, accepts:['end','lan','net'],desc:'×1.5 revenus sécurisés' },
    serveur:    { icon:'🖥️', name:'Serveur',     cat:'srv', col:[236,72,153],  cost:600,  unlocked:false, accepts:null,              desc:'Apps serveur haute perf.' },
    datacenter: { icon:'🏢', name:'Datacenter',  cat:'wan', col:[239,68,68],   cost:3000, unlocked:false, accepts:['net','sec'],      desc:'×2 revenus globaux · 8.8.8.1' },
  };

  /* ── App definitions ─────────────────────────────────────── */
  const ri = (a,b) => a + Math.floor(Math.random()*(b-a+1));
  const rp = arr   => arr[Math.floor(Math.random()*arr.length)];

  const APP_DEFS = {
    browser: { icon:'🌐', name:'Navigateur Web',    cost:50,   rev:1,   for:['end','srv'],
      challenge:{ desc:"Ajoute timeout à result dans une boucle de factor tours (result commence à 0)", objective:"result = timeout × factor",
        make:()=>{ const t=ri(5,20),f=ri(2,6); return {vars:{result:0,timeout:t,factor:f},target:t*f,varName:'result'}; },
        kw:[{l:'for (',rx:/\bfor\s*\(/},{l:'+=',rx:/\+=/}] }},
    email: { icon:'📧', name:'Client Email',        cost:150,  rev:3,   for:['end'],
      challenge:{ desc:"Part de port = 0, avance par step jusqu'à strictement dépasser limite", objective:"port = 1er multiple de step > limite",
        make:()=>{ const s=rp([7,11,13,17]); const p=ri(20,80); let r=0; while(r<=p)r+=s; return {vars:{port:0,step:s,limite:p},target:r,varName:'port'}; },
        kw:[{l:'while (',rx:/\bwhile\s*\(/},{l:'+=',rx:/\+=/}] }},
    office: { icon:'💼', name:'Suite Bureautique',  cost:400,  rev:8,   for:['end'],
      challenge:{ desc:"Multiplie workers par 2 à chaque tour de boucle, exponent fois (workers commence à 1)", objective:"workers = 2 ^ exponent",
        make:()=>{ const e=ri(2,5); return {vars:{workers:1,exponent:e},target:Math.pow(2,e),varName:'workers'}; },
        kw:[{l:'for (',rx:/\bfor\s*\(/},{l:'*=',rx:/\*=/}] }},
    webapp: { icon:'🌍', name:'Serveur Web',         cost:500,  rev:15,  for:['srv'],
      challenge:{ desc:"Selon la valeur de protocol, assigne le bon numéro de port à la variable port", objective:"http → 80 · https → 443 · ws → 8080",
        make:()=>{ const t=rp([{n:'http',p:80},{n:'https',p:443},{n:'ws',p:8080}]); return {vars:{port:0,protocol:t.n},target:t.p,varName:'port'}; },
        kw:[{l:'if (',rx:/\bif\s*\(/},{l:'===',rx:/===/}] }},
    mining: { icon:'⛏️', name:'Minage Crypto',      cost:1200, rev:20,  for:['end','srv'],
      challenge:{ desc:"Parcours les entiers de 1 à limit — si i est un multiple de divisor, incrémente threads", objective:"threads = nombre de multiples de divisor entre 1 et limit",
        make:()=>{ const d=rp([2,3,4,5,6]),l=ri(12,50); let c=0; for(let i=1;i<=l;i++) if(i%d===0)c++; return {vars:{threads:0,divisor:d,limit:l},target:c,varName:'threads'}; },
        kw:[{l:'for (',rx:/\bfor\s*\(/},{l:'if (',rx:/\bif\s*\(/},{l:'%',rx:/%/}] }},
    database: { icon:'🗄️', name:'Base de données',  cost:1500, rev:30,  for:['srv'],
      challenge:{ desc:"Additionne tous les entiers pairs de 0 à n inclus dans port (utilise % 2 pour tester la parité)", objective:"port = somme des pairs de 0 à n",
        make:()=>{ const n=ri(4,12)*2; let s=0; for(let i=0;i<=n;i++) if(i%2===0)s+=i; return {vars:{port:0,n},target:s,varName:'port'}; },
        kw:[{l:'for (',rx:/\bfor\s*\(/},{l:'%',rx:/%/},{l:'+=',rx:/\+=/}] }},
    trading: { icon:'📈', name:'Bot de Trading',    cost:4000, rev:60,  for:['end','srv'],
      challenge:{ desc:"Double interval à chaque tour jusqu'à atteindre ou dépasser threshold (interval commence à 1)", objective:"interval = plus petite puissance de 2 ≥ threshold",
        make:()=>{ const t=rp([10,15,20,30,50,75,100]); let v=1; while(v<t)v*=2; return {vars:{interval:1,threshold:t},target:v,varName:'interval'}; },
        kw:[{l:'while (',rx:/\bwhile\s*\(/},{l:'*=',rx:/\*=/}] }},
    ai_srv:  { icon:'🤖', name:'IA en Production',  cost:8000, rev:120, for:['srv'],
      challenge:{ desc:"Calcule la somme des carrés de 1 à n : 1×1 + 2×2 + ... + n×n, stocke dans gpu_id", objective:"gpu_id = 1² + 2² + … + n²",
        make:()=>{ const n=ri(3,8); let s=0; for(let i=1;i<=n;i++)s+=i*i; return {vars:{gpu_id:0,n},target:s,varName:'gpu_id'}; },
        kw:[{l:'for (',rx:/\bfor\s*\(/},{l:'+=',rx:/\+=/},{l:'i * i  ou  i**2',rx:/i\s*\*\s*i|i\s*\*\*\s*2/}] }},
    antivirus:{ icon:'🛡️', name:'Antivirus',         cost:600,  rev:0,   for:['end','srv'], isDefense:true, attackReduce:0.5,
      challenge:{ desc:"Parcours les entiers de 1 à n — si i est impair (reste % 2 différent de 0), incrémente threats", objective:"threats = nombre d'entiers impairs de 1 à n",
        make:()=>{ const n=ri(5,15)*2-1; let c=0; for(let i=1;i<=n;i++) if(i%2!==0)c++; return {vars:{threats:0,n},target:c,varName:'threats'}; },
        kw:[{l:'for (',rx:/\bfor\s*\(/},{l:'if (',rx:/\bif\s*\(/},{l:'%',rx:/%/}] }},
    vpn:     { icon:'🔒', name:'VPN',                cost:2000, rev:5,   for:['end','srv'], isDefense:true, attackReduce:0.85,
      challenge:{ desc:"Décrémente key tant qu'il n'est pas divisible par divisor (tant que key % divisor !== 0)", objective:"key = plus grand multiple de divisor ≤ valeur initiale de key",
        make:()=>{ const d=rp([3,4,5,6,7]); const a=ri(15,50); const r=a-a%d; return {vars:{key:a,divisor:d},target:r,varName:'key'}; },
        kw:[{l:'while (',rx:/\bwhile\s*\(/},{l:'%',rx:/%/}] }},
  };

  const CAT_LABEL = { end:'POSTE', srv:'SERVEUR', lan:'LAN', net:'RÉSEAU', sec:'SÉCURITÉ', wan:'WAN' };
  const WAN_ADDR  = { fai: '1.1.1.1', datacenter: '8.8.8.1' };

  function defaultCfg(type) {
    const cat = DEFS[type].cat;
    if (['end','srv'].includes(cat)) return { addr: '', gw: '' };
    if (['net','sec'].includes(cat)) return { lanIp: '', wanIp: '' };
    if (cat === 'wan') return { addr: WAN_ADDR[type] || '1.1.1.1' };
    return {};
  }

  function nodeAppRevenue(n) {
    return n.apps?.reduce((s, a) => s + (APP_DEFS[a]?.rev || 0), 0) || 0;
  }

  /* ── Challenges ─────────────────────────────────────────── */
  const CHALS = [
    { id:'c1', title:'LAN connecté',      desc:'Relier un PC à un Switch',                    done:false, reward:null,         check:()=>edges.some(e=>{const a=nodes.find(n=>n.id===e.from),b=nodes.find(n=>n.id===e.to);return a&&b&&(a.type==='pc'||b.type==='pc')&&(a.type==='switch_'||b.type==='switch_');}) },
    { id:'c2', title:'Routeur configuré', desc:"Configurer l'IP LAN d'un Routeur",             done:false, reward:'firewall',   check:()=>nodes.some(n=>n.type==='routeur'&&isValidIP(n.cfg.lanIp)) },
    { id:'c3', title:'En ligne !',        desc:'Mettre un appareil en ligne',                   done:false, reward:'serveur',    check:()=>onlineCount()>=1 },
    { id:'c4', title:'Première app',      desc:'Installer une app sur un PC en ligne',          done:false, reward:'datacenter', check:()=>nodes.some(n=>n.online&&n.apps?.length>0) },
    { id:'c5', title:'1 000 💰',          desc:'Accumuler 1 000 argent',                        done:false, reward:null,         check:()=>argent>=1000 },
    { id:'c6', title:'Réseau sécurisé',   desc:'Mettre un Pare-feu en ligne',                   done:false, reward:null,         check:()=>nodes.some(n=>n.type==='firewall'&&n.online) },
  ];

  /* ── State ─────────────────────────────────────────────── */
  const vp    = { x: 0, y: 0, scale: 1 };
  const nodes = [];
  const edges = [];
  let nodeSeq = 0, edgeSeq = 0;
  let totalData = 0, dataPerSec = 0;
  let argent = 1000, moneyPerSec = 0;
  let animT = 0, lastTs = 0;

  let panDrag = null, nodeDrag = null;
  let connFrom = null, connPos = null;
  let openMenuId = null;
  let ipcTargetId = null, apsTargetId = null;
  let cchNodeId = null, cchAppKey = null, cchState = null; // cchState = {vars, target, varName}
  const NW = 160, GRID = 40, CSB_W = 220, CSB_H = 150;

  /* ── Attack state ─────────────────────────────────────────── */
  const attacks  = new Set(); // Set of attacked node IDs
  let attackCooldown = 0;     // seconds until next attack can start

  /* ── Helpers ────────────────────────────────────────────── */
  function w2s(wx, wy) { return { x: wx * vp.scale + vp.x, y: wy * vp.scale + vp.y }; }
  function s2w(sx, sy) { return { x: (sx - vp.x) / vp.scale, y: (sy - vp.y) / vp.scale }; }
  function outP(n) { const s = w2s(n.x, n.y); return { x: s.x + NW/2 * vp.scale, y: s.y }; }
  function inP(n)  { const s = w2s(n.x, n.y); return { x: s.x - NW/2 * vp.scale, y: s.y }; }
  function fmtN(v) {
    v = Math.floor(v);
    if (v < 1000) return String(v);
    if (v < 1e6)  return (v/1000).toFixed(1).replace('.0','')+'K';
    return (v/1e6).toFixed(1).replace('.0','')+'M';
  }
  function isSidebarBottom() { return window.innerWidth <= 640; }
  function canvasW() { return isSidebarBottom() ? canvas.width : canvas.width - CSB_W; }
  function canvasH() { return isSidebarBottom() ? canvas.height - CSB_H : canvas.height; }
  function onlineCount() { return nodes.filter(n => n.online).length; }

  function isValidIP(s) {
    if (!s || typeof s !== 'string') return false;
    const p = s.trim().split('.');
    return p.length === 4 && p.every(x => /^\d{1,3}$/.test(x) && +x >= 0 && +x <= 255);
  }
  function sameNet24(a, b) {
    if (!isValidIP(a) || !isValidIP(b)) return false;
    const pa = a.split('.'), pb = b.split('.');
    return pa[0]===pb[0] && pa[1]===pb[1] && pa[2]===pb[2];
  }

  /* ── Resize ─────────────────────────────────────────────── */
  function resize() { canvas.width = wrapper.clientWidth; canvas.height = wrapper.clientHeight; }

  /* ── Online computation (IP-aware path validation) ─────── */
  function computeOnline() {
    const up = new Set();

    // WAN nodes are always reachable
    nodes.filter(n => DEFS[n.type].cat === 'wan').forEach(n => up.add(n.id));

    // Router: up if valid LAN+WAN IPs AND output connects to up WAN (matching subnet)
    nodes.filter(n => n.type === 'routeur').forEach(n => {
      if (!isValidIP(n.cfg.lanIp) || !isValidIP(n.cfg.wanIp)) return;
      const ok = edges.filter(e => e.from === n.id).some(e => {
        const to = nodes.find(nd => nd.id === e.to);
        return to && up.has(to.id) && DEFS[to.type].cat === 'wan' && sameNet24(n.cfg.wanIp, to.cfg.addr);
      });
      if (ok) up.add(n.id);
    });

    // Firewall: up if valid IPs AND output connects to up WAN
    nodes.filter(n => n.type === 'firewall').forEach(n => {
      if (!isValidIP(n.cfg.lanIp) || !isValidIP(n.cfg.wanIp)) return;
      const ok = edges.filter(e => e.from === n.id).some(e => {
        const to = nodes.find(nd => nd.id === e.to);
        return to && up.has(to.id) && DEFS[to.type].cat === 'wan' && sameNet24(n.cfg.wanIp, to.cfg.addr);
      });
      if (ok) up.add(n.id);
    });

    // Switch: up if output connects to an up Router/Firewall
    nodes.filter(n => n.type === 'switch_').forEach(n => {
      const ok = edges.filter(e => e.from === n.id).some(e => {
        const to = nodes.find(nd => nd.id === e.to);
        return to && up.has(to.id) && ['net','sec'].includes(DEFS[to.type].cat);
      });
      if (ok) up.add(n.id);
    });

    // PC/Server: up if valid IP+GW, and reaches up Switch (with upstream router matching GW)
    // or directly reaches an up Router/Firewall with matching LAN IP
    nodes.filter(n => ['end','srv'].includes(DEFS[n.type].cat)).forEach(n => {
      if (!isValidIP(n.cfg.addr) || !isValidIP(n.cfg.gw)) return;
      if (!sameNet24(n.cfg.addr, n.cfg.gw)) return;
      const ok = edges.filter(e => e.from === n.id).some(e => {
        const to = nodes.find(nd => nd.id === e.to);
        if (!to || !up.has(to.id)) return false;
        if (DEFS[to.type].cat === 'lan') {
          // Via switch: any downstream router/fw must have matching LAN IP
          return edges.filter(ee => ee.from === to.id).some(ee => {
            const rtr = nodes.find(nd => nd.id === ee.to);
            return rtr && up.has(rtr.id) && ['net','sec'].includes(DEFS[rtr.type].cat) && rtr.cfg.lanIp === n.cfg.gw;
          });
        }
        if (['net','sec'].includes(DEFS[to.type].cat)) return to.cfg.lanIp === n.cfg.gw;
        return false;
      });
      if (ok) up.add(n.id);
    });

    nodes.forEach(n => { n.online = up.has(n.id); });
  }

  /* ── Rate computation ────────────────────────────────────── */
  function reRates() {
    computeOnline();
    dataPerSec = nodes.filter(n => n.online).length * 2;
    // Attacked nodes generate no revenue
    const appRev = nodes.reduce((s, n) => s + (n.online && !attacks.has(n.id) ? nodeAppRevenue(n) : 0), 0);
    const secBonus = Math.pow(1.5, nodes.filter(n => n.online && n.type === 'firewall').length);
    const dcBonus  = Math.pow(2,   nodes.filter(n => n.online && n.type === 'datacenter').length);
    moneyPerSec = appRev * secBonus * dcBonus;
  }

  /* ── Attack system ──────────────────────────────────────── */
  function nodeAttackProbability(n) {
    // Base multiplier from defense apps
    const reduce = (n.apps || []).reduce((m, a) => m * (1 - (APP_DEFS[a]?.attackReduce || 0)), 1);
    // Firewall protects nodes upstream of it (rough heuristic: if a firewall is online, global protection)
    const fwBonus = nodes.some(nd => nd.online && nd.type === 'firewall') ? 0.5 : 1;
    return reduce * fwBonus;
  }

  function tickAttacks(dt) {
    attackCooldown -= dt;
    if (attackCooldown > 0) return;

    // Attack frequency grows with totalData (more traffic = more visibility on the internet)
    // Min interval ~45s early game, ~18s at high traffic
    const minInterval = Math.max(18, 45 - totalData / 800);

    // Only pick from online end/srv nodes that aren't already attacked
    const targets = nodes.filter(n =>
      n.online &&
      ['end','srv'].includes(DEFS[n.type].cat) &&
      !attacks.has(n.id) &&
      nodeAppRevenue(n) > 0
    );
    if (!targets.length) { attackCooldown = minInterval; return; }

    // Pick a random target weighted by attack probability (higher prob = more likely)
    const weights = targets.map(n => nodeAttackProbability(n));
    const totalW  = weights.reduce((s, w) => s + w, 0);
    if (totalW <= 0) { attackCooldown = minInterval; return; }

    let r = Math.random() * totalW;
    let chosen = null;
    for (let i = 0; i < targets.length; i++) {
      r -= weights[i];
      if (r <= 0) { chosen = targets[i]; break; }
    }
    if (!chosen) chosen = targets[targets.length - 1];

    // Only trigger if random chance is met (defense apps can push this to near-zero)
    const baseChance = Math.min(0.85, 0.35 + totalData / 15000);
    if (Math.random() > baseChance * nodeAttackProbability(chosen)) {
      attackCooldown = minInterval * 0.6;
      return;
    }

    attacks.add(chosen.id);
    reRates();
    showAttackAlert(chosen);
    attackCooldown = minInterval;
  }

  function resolveAttack(nodeId) {
    if (!attacks.has(nodeId)) return;
    attacks.delete(nodeId);
    reRates();
    updateAttackAlerts();
  }

  function showAttackAlert(node) {
    const el = document.getElementById('csb-alerts');
    if (!el) return;
    el.hidden = false;
    const def = DEFS[node.type];
    const item = document.createElement('div');
    item.className = 'attack-alert';
    item.dataset.nodeId = node.id;
    item.innerHTML = `<span class="atk-icon">⚠️</span><span class="atk-msg"><b>${def.icon} ${def.name}</b><br><small>Reconfigurer l'IP pour résoudre</small></span>`;
    item.addEventListener('click', () => openIPConfig(node.id));
    el.appendChild(item);
    // Pulse the sidebar
    const csb = document.getElementById('csb');
    if (csb) { csb.classList.add('notif'); setTimeout(() => csb.classList.remove('notif'), 1400); }
  }

  function updateAttackAlerts() {
    const el = document.getElementById('csb-alerts');
    if (!el) return;
    el.querySelectorAll('.attack-alert').forEach(item => {
      if (!attacks.has(item.dataset.nodeId)) item.remove();
    });
    if (!el.children.length) el.hidden = true;
  }

  /* ── Connection validation ──────────────────────────────── */
  function canConnect(fromId, toId) {
    const fn = nodes.find(n => n.id === fromId);
    const tn = nodes.find(n => n.id === toId);
    if (!fn || !tn) return false;
    const acc = DEFS[tn.type].accepts;
    if (acc === null) return false;
    if (!acc.includes(DEFS[fn.type].cat)) return false;
    // Switch port limit: max 4 input connections
    if (DEFS[tn.type].cat === 'lan' && edges.filter(e => e.to === toId).length >= 4) return false;
    return true;
  }

  function flashError(nodeId) {
    const el = document.getElementById(`cn-${nodeId}`);
    if (!el) return;
    el.classList.add('error');
    setTimeout(() => el.classList.remove('error'), 500);
  }

  /* ── IP auto-suggest ─────────────────────────────────────── */
  function suggestIPForNode(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const visited = new Set([nodeId]);
    const queue = [nodeId];
    while (queue.length) {
      const curr = queue.shift();
      for (const e of edges.filter(e2 => e2.from === curr)) {
        const to = nodes.find(n => n.id === e.to);
        if (!to || visited.has(to.id)) continue;
        visited.add(to.id);
        if (['net','sec'].includes(DEFS[to.type].cat) && isValidIP(to.cfg.lanIp)) {
          const subnet = to.cfg.lanIp.split('.').slice(0,3).join('.');
          const used = new Set(nodes
            .filter(n => n.id !== nodeId && isValidIP(n.cfg?.addr) && n.cfg.addr.startsWith(subnet+'.'))
            .map(n => +n.cfg.addr.split('.')[3])
          );
          used.add(+to.cfg.lanIp.split('.')[3]);
          let octet = 10;
          while (used.has(octet) && octet < 254) octet++;
          return { addr: `${subnet}.${octet}`, gw: to.cfg.lanIp };
        }
        queue.push(to.id);
      }
    }
    return null;
  }

  /* ── IP config modal ─────────────────────────────────────── */
  function openIPConfig(id) {
    const node = nodes.find(n => n.id === id);
    if (!node || !ipcModal) return;
    ipcTargetId = id;
    const def = DEFS[node.type];
    const cat = def.cat;

    const isAttacked = attacks.has(id);
    document.getElementById('ipc-title').textContent = isAttacked
      ? `⚠️ ${def.name} — ATTAQUÉ ! Changer l'IP`
      : `${def.icon} ${def.name} — IP`;
    document.getElementById('ipc-err').textContent = isAttacked
      ? 'Votre nœud est sous attaque ! Entrez une nouvelle IP pour couper la connexion.'
      : '';

    const body = document.getElementById('ipc-body');
    const suggestBtn = `<button type="button" id="ipc-suggest" class="ipc-suggest-btn">📡 Suggestion auto (depuis la topologie)</button>`;
    if (['end','srv'].includes(cat)) {
      body.innerHTML = `
        <label>Adresse IP<input id="ipc-f1" placeholder="ex. 192.168.1.10" value="${node.cfg.addr||''}"></label>
        <label>Passerelle (Gateway)<input id="ipc-f2" placeholder="ex. 192.168.1.1" value="${node.cfg.gw||''}"></label>
        ${suggestBtn}`;
      document.getElementById('ipc-suggest')?.addEventListener('click', () => {
        const sug = suggestIPForNode(ipcTargetId);
        if (!sug) { document.getElementById('ipc-err').textContent = 'Aucun routeur configuré trouvé en aval.'; return; }
        document.getElementById('ipc-f1').value = sug.addr;
        document.getElementById('ipc-f2').value = sug.gw;
        document.getElementById('ipc-err').textContent = '';
      });
    } else if (['net','sec'].includes(cat)) {
      body.innerHTML = `
        <label>IP LAN (côté réseau local)<input id="ipc-f1" placeholder="ex. 192.168.1.1" value="${node.cfg.lanIp||''}"></label>
        <label>IP WAN (côté internet — doit être en 1.1.1.x)<input id="ipc-f2" placeholder="ex. 1.1.1.2" value="${node.cfg.wanIp||''}"></label>`;
    } else if (cat === 'wan') {
      body.innerHTML = `<p class="ipc-fixed">Adresse fixe : <b>${node.cfg.addr}</b><br>Sous-réseau WAN : <b>${node.cfg.addr.split('.').slice(0,3).join('.')}.0/24</b></p>`;
    } else {
      body.innerHTML = `<p class="ipc-fixed">Switch : aucune IP requise (L2 transparent).</p>`;
    }
    ipcModal.classList.add('open');
    setTimeout(() => body.querySelector('input')?.focus(), 50);
  }

  function applyIPConfig() {
    const node = nodes.find(n => n.id === ipcTargetId);
    if (!node || !ipcModal) return;
    const cat = DEFS[node.type].cat;
    const err = document.getElementById('ipc-err');
    const f1v = document.getElementById('ipc-f1')?.value.trim();
    const f2v = document.getElementById('ipc-f2')?.value.trim();
    document.querySelectorAll('#ipc-body input').forEach(i => i.classList.remove('invalid'));
    err.textContent = '';

    if (['end','srv'].includes(cat)) {
      if (!isValidIP(f1v)) { err.textContent = 'Adresse IP invalide.'; document.getElementById('ipc-f1').classList.add('invalid'); return; }
      if (!isValidIP(f2v)) { err.textContent = 'Passerelle invalide.'; document.getElementById('ipc-f2').classList.add('invalid'); return; }
      if (!sameNet24(f1v, f2v)) { err.textContent = 'IP et passerelle doivent être dans le même /24.'; return; }
      // Check uniqueness against all IPs on the network
      const allUsed = nodes.filter(n => n.id !== ipcTargetId).flatMap(n => [n.cfg?.addr, n.cfg?.lanIp].filter(Boolean));
      if (allUsed.includes(f1v)) { err.textContent = 'Cette adresse IP est déjà utilisée.'; document.getElementById('ipc-f1').classList.add('invalid'); return; }
      node.cfg.addr = f1v; node.cfg.gw = f2v;
    } else if (['net','sec'].includes(cat)) {
      if (!isValidIP(f1v)) { err.textContent = 'IP LAN invalide.'; document.getElementById('ipc-f1').classList.add('invalid'); return; }
      if (!isValidIP(f2v)) { err.textContent = 'IP WAN invalide.'; document.getElementById('ipc-f2').classList.add('invalid'); return; }
      const allUsed = nodes.filter(n => n.id !== ipcTargetId).flatMap(n => [n.cfg?.addr, n.cfg?.lanIp, n.cfg?.wanIp].filter(Boolean));
      if (allUsed.includes(f1v)) { err.textContent = 'IP LAN déjà utilisée.'; document.getElementById('ipc-f1').classList.add('invalid'); return; }
      node.cfg.lanIp = f1v; node.cfg.wanIp = f2v;
    }

    ipcModal.classList.remove('open');
    const wasAttacked = attacks.has(ipcTargetId);
    resolveAttack(ipcTargetId);
    ipcTargetId = null;
    reRates(); checkChals(); renderShop();
    if (wasAttacked) updateAttackAlerts();
  }

  function closeIPConfig() { ipcModal?.classList.remove('open'); ipcTargetId = null; }

  if (ipcModal) {
    document.getElementById('ipc-close')?.addEventListener('click', closeIPConfig);
    document.getElementById('ipc-cancel')?.addEventListener('click', closeIPConfig);
    document.getElementById('ipc-apply')?.addEventListener('click', applyIPConfig);
    ipcModal.addEventListener('click', e => { if (e.target === ipcModal) closeIPConfig(); });
    ipcModal.addEventListener('keydown', e => { if (e.key === 'Enter') applyIPConfig(); if (e.key === 'Escape') closeIPConfig(); });
    [document.getElementById('ipc-close'), document.getElementById('ipc-cancel'), document.getElementById('ipc-apply')].forEach(b => {
      if (!b) return;
      b.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      b.addEventListener('mouseleave',  () => document.body.classList.remove('cursor-hover'));
    });
  }

  /* ── App store modal ─────────────────────────────────────── */
  function openAppStore(id) {
    const node = nodes.find(n => n.id === id);
    if (!node || !apsModal) return;
    apsTargetId = id;
    const def = DEFS[node.type];
    document.getElementById('aps-title').textContent = `${def.icon} ${def.name} — Apps`;
    refreshAppStore();
    apsModal.classList.add('open');
  }

  function refreshAppStore() {
    const node = nodes.find(n => n.id === apsTargetId);
    if (!node) return;
    const cat = DEFS[node.type].cat;

    const instEl = document.getElementById('aps-installed');
    if (instEl) {
      if (!node.apps?.length) {
        instEl.innerHTML = '<span class="aps-empty">Aucune app installée</span>';
      } else {
        instEl.innerHTML = node.apps.map(a => `<span class="aps-chip">${APP_DEFS[a].icon} ${APP_DEFS[a].name}</span>`).join('');
      }
    }

    const shopEl = document.getElementById('aps-shop');
    if (!shopEl) return;
    shopEl.innerHTML = '';
    Object.entries(APP_DEFS).forEach(([key, app]) => {
      if (!app.for.includes(cat)) return;
      const installed = node.apps?.includes(key);
      const can = !installed && argent >= app.cost;
      const btn = document.createElement('button');
      btn.className = `aps-item${installed ? ' installed' : ''}${!can && !installed ? ' cant' : ''}`;
      const revStr = app.isDefense
        ? (app.rev > 0 ? `+${app.rev} 💰/s · 🛡️ défense` : '🛡️ défense — réduit les attaques')
        : `+${app.rev} 💰/s`;
      btn.innerHTML = `
        <span class="aps-icon">${app.icon}</span>
        <span class="csi-info"><b>${app.name}</b><small>${revStr}${installed ? ' · installé' : ''}</small></span>
        <span class="aps-cost${installed ? ' done' : ''}">${installed ? '✓' : fmtN(app.cost)+'💰'}</span>`;
      if (!installed && can) {
        btn.addEventListener('click', () => openCodeChallenge(apsTargetId, key));
      }
      shopEl.appendChild(btn);
    });
  }

  function closeAppStore() { apsModal?.classList.remove('open'); apsTargetId = null; }

  /* ── Code Challenge ─────────────────────────────────────── */
  function runSandbox(code, vars, varName) {
    const decls = Object.entries(vars).map(([k,v]) => `let ${k} = ${JSON.stringify(v)};`).join('\n');
    const keys  = Object.keys(vars);
    try {
      // Shadow browser globals for basic safety
      const fn = new Function(
        'window','document','fetch','XMLHttpRequest','alert','prompt','confirm','eval','Function',
        `${decls}\n${code}\nreturn {${keys.join(',')}};`
      );
      const out = fn(undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined);
      return { ok: true, value: out[varName] };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  }

  function openCodeChallenge(nodeId, appKey) {
    const app = APP_DEFS[appKey];
    if (!app?.challenge) return;
    const ch = app.challenge;
    cchNodeId = nodeId; cchAppKey = appKey;
    cchState  = ch.make();

    const modal = document.getElementById('code-challenge');
    if (!modal) return;
    document.getElementById('cch-title').textContent     = `${app.icon} Installer — ${app.name}`;
    document.getElementById('cch-desc').textContent      = ch.desc;
    document.getElementById('cch-objective').textContent = `Objectif : ${ch.objective}`;

    // Display injected variables
    const varsEl = document.getElementById('cch-vars');
    varsEl.innerHTML = Object.entries(cchState.vars)
      .map(([k,v]) => `<span class="cch-var"><span class="cch-vname">${k}</span><span class="cch-veq"> = </span><span class="cch-vval">${JSON.stringify(v)}</span></span>`)
      .join('');

    // Display required constructs
    const kwEl = document.getElementById('cch-keywords');
    kwEl.innerHTML = ch.kw.map(k => `<code class="cch-kw">${k.l}</code>`).join('');

    const input = document.getElementById('cch-input');
    const varNames = Object.keys(cchState.vars).join(', ');
    input.value = `// Variables disponibles : ${varNames}\n`;
    document.getElementById('cch-err').textContent = '';
    modal.classList.add('open');
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }, 80);
  }

  function submitCodeChallenge() {
    const code  = document.getElementById('cch-input').value.trim();
    const app   = APP_DEFS[cchAppKey];
    const ch    = app.challenge;
    const { vars, target, varName } = cchState;
    const errEl = document.getElementById('cch-err');
    const inputEl = document.getElementById('cch-input');
    const shake = msg => {
      errEl.textContent = msg;
      inputEl.classList.add('cch-shake');
      setTimeout(() => inputEl.classList.remove('cch-shake'), 400);
    };

    // Check constructs via regex
    const missing = ch.kw.filter(k => !k.rx.test(code));
    if (missing.length) { shake(`Construit manquant : ${missing.map(k=>k.l).join(', ')}`); return; }

    // Run code in sandbox
    const result = runSandbox(code, vars, varName);
    if (!result.ok) { shake(`Erreur : ${result.error}`); return; }
    if (result.value !== target) {
      shake(`${varName} = ${result.value} ✗  (attendu : ${target}) — Vérifie ta boucle et les bornes.`);
      return;
    }

    // Success — install app
    const node = nodes.find(n => n.id === cchNodeId);
    if (node && argent >= app.cost) {
      argent -= app.cost;
      if (!node.apps) node.apps = [];
      node.apps.push(cchAppKey);
      reRates(); checkChals(); updateShopAffordability();
      if (apsTargetId === cchNodeId) refreshAppStore();
    }
    closeCodeChallenge();
  }

  function closeCodeChallenge() {
    document.getElementById('code-challenge')?.classList.remove('open');
    cchNodeId = null; cchAppKey = null; cchState = null;
  }

  const cchModal = document.getElementById('code-challenge');
  if (cchModal) {
    document.getElementById('cch-close')?.addEventListener('click', closeCodeChallenge);
    document.getElementById('cch-cancel')?.addEventListener('click', closeCodeChallenge);
    document.getElementById('cch-submit')?.addEventListener('click', submitCodeChallenge);
    cchModal.addEventListener('click', e => { if (e.target === cchModal) closeCodeChallenge(); });
    document.getElementById('cch-help-btn')?.addEventListener('click', () => {
      const h = document.getElementById('cch-help');
      if (h) h.hidden = !h.hidden;
    });

    const cchInput = document.getElementById('cch-input');
    if (cchInput) {
      cchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitCodeChallenge(); return; }
        if (e.key === 'Escape') { closeCodeChallenge(); return; }

        // Auto-indent on Enter
        if (e.key === 'Enter') {
          e.preventDefault();
          const s = cchInput.selectionStart, val = cchInput.value;
          const lineStart = val.lastIndexOf('\n', s - 1) + 1;
          const indent = val.slice(lineStart, s).match(/^(\s*)/)[1];
          const extra  = val.slice(lineStart, s).trimEnd().endsWith('{') ? '  ' : '';
          cchInput.value = val.slice(0, s) + '\n' + indent + extra + val.slice(s);
          cchInput.selectionStart = cchInput.selectionEnd = s + 1 + indent.length + extra.length;
        }

        // Tab → 2 spaces
        if (e.key === 'Tab') {
          e.preventDefault();
          const s = cchInput.selectionStart, val = cchInput.value;
          cchInput.value = val.slice(0, s) + '  ' + val.slice(s);
          cchInput.selectionStart = cchInput.selectionEnd = s + 2;
        }

        // } → auto-dedent if line is only spaces
        if (e.key === '}') {
          const s = cchInput.selectionStart, val = cchInput.value;
          const lineStart = val.lastIndexOf('\n', s - 1) + 1;
          const lineContent = val.slice(lineStart, s);
          if (/^\s{2,}$/.test(lineContent)) {
            e.preventDefault();
            const newIndent = lineContent.slice(0, lineContent.length - 2);
            cchInput.value = val.slice(0, lineStart) + newIndent + '}' + val.slice(s);
            cchInput.selectionStart = cchInput.selectionEnd = lineStart + newIndent.length + 1;
          }
        }
      });
    }
  }

  if (apsModal) {
    document.getElementById('aps-close')?.addEventListener('click', closeAppStore);
    apsModal.addEventListener('click', e => { if (e.target === apsModal) closeAppStore(); });
    apsModal.addEventListener('keydown', e => { if (e.key === 'Escape') closeAppStore(); });
    document.getElementById('aps-close')?.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    document.getElementById('aps-close')?.addEventListener('mouseleave',  () => document.body.classList.remove('cursor-hover'));
  }

  /* ── Draw ───────────────────────────────────────────────── */
  function draw() {
    const W = canvasW(), H = canvasH();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();

    // Grid
    const isL = document.documentElement.getAttribute('data-theme') === 'light';
    const step = GRID * vp.scale;
    const ox = ((vp.x % step) + step) % step;
    const oy = ((vp.y % step) + step) % step;
    ctx.strokeStyle = isL ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath();
    for (let gx = ox-step; gx < W+step; gx += step) { ctx.moveTo(gx,0); ctx.lineTo(gx,H); }
    for (let gy = oy-step; gy < H+step; gy += step) { ctx.moveTo(0,gy); ctx.lineTo(W,gy); }
    ctx.stroke();

    // Edges — double lane: download (blue) + upload (orange)
    edges.forEach(edge => {
      const fn = nodes.find(n => n.id === edge.from);
      const tn = nodes.find(n => n.id === edge.to);
      if (!fn || !tn) return;
      const fp = outP(fn), tp = inP(tn);
      const cpx = Math.max(Math.abs(tp.x - fp.x) * 0.5, 50);
      const active = fn.online && tn.online;
      const off = 3; // perpendicular screen-space offset

      const DL = [77, 166, 255];   // download — blue
      const UL = [249, 115, 22];   // upload   — orange
      const AT = [239, 68, 68];    // attack   — red
      const idle = DEFS[fn.type].col;
      const underAttack = attacks.has(fn.id) || attacks.has(tn.id);

      ctx.save();

      // Two lanes: download on top, upload on bottom (red when attacked)
      [
        { col: underAttack ? AT : (active ? DL : idle), oy: -off, dir:  1 },
        { col: underAttack ? AT : (active ? UL : idle), oy: +off, dir: -1 },
      ].forEach(({ col, oy, dir }) => {
        const [r,g,b] = col;

        // Track (low-opacity solid)
        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y + oy);
        ctx.bezierCurveTo(fp.x+cpx, fp.y+oy, tp.x-cpx, tp.y+oy, tp.x, tp.y+oy);
        ctx.strokeStyle = `rgba(${r},${g},${b},${active ? 0.18 : 0.10})`;
        ctx.lineWidth = 2; ctx.setLineDash([]);
        ctx.stroke();

        // Animated flow dashes when active
        if (active) {
          ctx.beginPath();
          ctx.moveTo(fp.x, fp.y + oy);
          ctx.bezierCurveTo(fp.x+cpx, fp.y+oy, tp.x-cpx, tp.y+oy, tp.x, tp.y+oy);
          ctx.strokeStyle = `rgba(${r},${g},${b},0.88)`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 13]);
          ctx.lineDashOffset = -(animT * 38 * dir);
          ctx.stroke();
        }
      });

      ctx.restore();
    });

    // Connection in progress
    if (connFrom !== null && connPos) {
      const fn = nodes.find(n => n.id === connFrom);
      if (fn) {
        const fp = outP(fn);
        const [r,g,b] = DEFS[fn.type].col;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(fp.x, fp.y); ctx.lineTo(connPos.x, connPos.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth = 1.5; ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();

    // Sync DOM nodes
    nodes.forEach(n => {
      const el = document.getElementById(`cn-${n.id}`);
      if (!el) return;
      const s = w2s(n.x, n.y);
      el.style.left      = `${s.x}px`;
      el.style.top       = `${s.y}px`;
      el.style.transform = `translate(-50%,-50%) scale(${vp.scale})`;

      const dotEl = el.querySelector('.node-online-dot');
      if (dotEl) dotEl.className = `node-online-dot${n.online ? ' is-online' : ''}`;

      el.classList.toggle('attacked', attacks.has(n.id));

      const rEl = el.querySelector('.node-rate');
      if (rEl) {
        const def = DEFS[n.type];
        if (['end','srv'].includes(def.cat)) {
          if (attacks.has(n.id)) {
            rEl.textContent = '⚠️ ATTAQUÉ — changer IP';
            rEl.style.color = '#ef4444';
            rEl.style.opacity = '1';
          } else if (n.online) {
            const rev = nodeAppRevenue(n);
            rEl.textContent = rev > 0 ? `+${rev} 💰/s` : '0 app — 0 💰/s';
            rEl.style.color = '';
          } else {
            rEl.textContent = isValidIP(n.cfg?.addr) ? 'chemin invalide' : 'non configuré';
            rEl.style.color = 'var(--text-muted)';
          }
          if (!attacks.has(n.id)) rEl.style.opacity = n.online ? '1' : '0.5';
        } else if (def.cat === 'lan') {
          const portCount = edges.filter(e => e.to === n.id).length;
          rEl.textContent = `${portCount}/4 ports`;
          rEl.style.color = portCount >= 4 ? '#f97316' : '';
          rEl.style.opacity = '1';
        } else {
          rEl.textContent = n.online ? '● en ligne' : '○ hors ligne';
          rEl.style.color = n.online ? '#4ade80' : 'var(--text-muted)';
          rEl.style.opacity = n.online ? '1' : '0.45';
        }
      }

      const catEl = el.querySelector('.node-cat');
      if (catEl) {
        const def = DEFS[n.type];
        if (def.cat === 'wan') catEl.textContent = n.cfg.addr;
        else if (['end','srv'].includes(def.cat)) catEl.textContent = n.cfg.addr || '—';
        else if (['net','sec'].includes(def.cat)) catEl.textContent = n.cfg.lanIp || '—';
        else catEl.textContent = '';
      }
    });
  }

  /* ── addNode ────────────────────────────────────────────── */
  function addNode(type, wx, wy) {
    const def = DEFS[type];
    if (!def || !def.unlocked) return null;
    nodeSeq++;
    const id = nodeSeq;
    const cfg = defaultCfg(type);
    nodes.push({ id, type, x: wx, y: wy, online: false, cfg, apps: [] });

    const [r,g,b] = def.col;
    const hasInput  = def.accepts !== null; // end/srv have no input port
    const needsCfg  = ['end','srv','net','sec'].includes(def.cat);
    const needsApps = ['end','srv'].includes(def.cat);
    const el = document.createElement('div');
    el.className = 'canvas-node';
    el.id = `cn-${id}`;
    el.style.setProperty('--node-color', `rgb(${r},${g},${b})`);
    el.innerHTML = `
      ${hasInput ? '<div class="node-port node-port-in"></div>' : ''}
      <div class="node-body">
        <span class="node-icon">${def.icon}</span>
        <div class="node-info">
          <span class="node-name">${def.name}</span>
          <span class="node-rate">${def.cat === 'wan' ? def.desc.split('·')[0].trim() : 'non configuré'}</span>
        </div>
      </div>
      <span class="node-online-dot"></span>
      <div class="node-port node-port-out"></div>
      <button class="node-dots" aria-label="Options">⋯</button>
      <div class="node-menu">
        ${needsApps ? `<button class="ndm-item" data-action="apps">💾 Applications</button>` : ''}
        ${needsCfg  ? `<button class="ndm-item" data-action="config">⚙️ Configurer IP</button>` : ''}
        <button class="ndm-item" data-action="rename">✏️ Renommer</button>
        <button class="ndm-item danger" data-action="delete">🗑️ Supprimer</button>
      </div>
      <span class="node-cat">${def.cat === 'wan' ? cfg.addr : '—'}</span>`;
    nodesDiv.appendChild(el);

    const body    = el.querySelector('.node-body');
    const portOut = el.querySelector('.node-port-out');
    const portIn  = el.querySelector('.node-port-in'); // null for end/srv
    const dotsBtn = el.querySelector('.node-dots');
    const menuEl  = el.querySelector('.node-menu');

    body.addEventListener('pointerdown', e => {
      e.stopPropagation();
      body.setPointerCapture(e.pointerId);
      const node = nodes.find(n => n.id === id);
      nodeDrag = { id, ox: e.clientX, oy: e.clientY, nx: node.x, ny: node.y };
      closeMenu();
    });
    body.addEventListener('pointermove', e => {
      if (!nodeDrag || nodeDrag.id !== id) return;
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      node.x = nodeDrag.nx + (e.clientX - nodeDrag.ox) / vp.scale;
      node.y = nodeDrag.ny + (e.clientY - nodeDrag.oy) / vp.scale;
    });
    body.addEventListener('pointerup', () => { if (nodeDrag?.id === id) nodeDrag = null; });

    portOut.addEventListener('pointerdown', e => {
      e.stopPropagation();
      portOut.setPointerCapture(e.pointerId);
      connFrom = id;
      const wr = wrapper.getBoundingClientRect();
      connPos = { x: e.clientX - wr.left, y: e.clientY - wr.top };
      closeMenu();
    });
    portOut.addEventListener('pointermove', e => {
      if (connFrom !== id) return;
      const wr = wrapper.getBoundingClientRect();
      connPos = { x: e.clientX - wr.left, y: e.clientY - wr.top };
    });
    portOut.addEventListener('pointerup', e => {
      if (connFrom !== id) return;
      const wr = wrapper.getBoundingClientRect();
      finishConnect(id, e.clientX - wr.left, e.clientY - wr.top);
    });

    if (portIn) {
      portIn.addEventListener('pointerup', e => {
        if (connFrom === null || connFrom === id) return;
        e.stopPropagation();
        tryConnect(connFrom, id);
        connFrom = null; connPos = null;
      });
    }

    dotsBtn.addEventListener('pointerdown', e => e.stopPropagation());
    dotsBtn.addEventListener('click', e => {
      e.stopPropagation();
      const was = openMenuId === id;
      closeMenu();
      if (!was) { openMenuId = id; menuEl.classList.add('open'); }
    });
    menuEl.querySelectorAll('.ndm-item').forEach(btn => {
      btn.addEventListener('pointerdown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        closeMenu();
        if (btn.dataset.action === 'apps') {
          openAppStore(id);
        } else if (btn.dataset.action === 'config') {
          openIPConfig(id);
        } else if (btn.dataset.action === 'rename') {
          const nameEl = el.querySelector('.node-name');
          const input = document.createElement('input');
          input.className = 'node-rename-input';
          input.value = nameEl.textContent;
          nameEl.replaceWith(input);
          input.focus(); input.select();
          const commit = () => {
            const v = input.value.trim();
            input.replaceWith(nameEl);
            if (v) nameEl.textContent = v;
          };
          const cancel = () => input.replaceWith(nameEl);
          input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            e.stopPropagation();
          });
          input.addEventListener('blur', commit);
          input.addEventListener('pointerdown', e => e.stopPropagation());
        } else if (btn.dataset.action === 'delete') {
          removeNode(id);
        }
      });
    });

    [el, portOut, dotsBtn, ...(portIn ? [portIn] : [])].forEach(b => {
      b.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      b.addEventListener('mouseleave',  () => document.body.classList.remove('cursor-hover'));
    });

    reRates(); renderShop(); checkChals();
    return id;
  }

  function tryConnect(fromId, toId) {
    if (!canConnect(fromId, toId)) { flashError(toId); return; }
    const dup = edges.some(e => e.from === fromId && e.to === toId);
    if (!dup) { edgeSeq++; edges.push({ id: edgeSeq, from: fromId, to: toId }); reRates(); checkChals(); }
  }

  function finishConnect(fromId, sx, sy) {
    for (const node of nodes) {
      if (node.id === fromId) continue;
      if (Math.hypot(inP(node).x - sx, inP(node).y - sy) < 22) { tryConnect(fromId, node.id); break; }
    }
    connFrom = null; connPos = null;
  }

  function removeNode(id) {
    const node = nodes.find(n => n.id === id);
    if (node) {
      const def = DEFS[node.type];
      argent += def.cost;
      (node.apps || []).forEach(a => { argent += APP_DEFS[a]?.cost || 0; });
    }
    nodes.splice(nodes.findIndex(n => n.id === id), 1);
    for (let i = edges.length-1; i>=0; i--) {
      if (edges[i].from === id || edges[i].to === id) edges.splice(i, 1);
    }
    document.getElementById(`cn-${id}`)?.remove();
    if (connFrom === id) { connFrom = null; connPos = null; }
    if (openMenuId === id) openMenuId = null;
    reRates(); renderShop();
  }

  function closeMenu() {
    if (openMenuId !== null) {
      document.querySelector(`#cn-${openMenuId} .node-menu`)?.classList.remove('open');
      openMenuId = null;
    }
  }

  /* ── Pan ────────────────────────────────────────────────── */
  canvas.addEventListener('pointerdown', e => {
    if (connFrom !== null) return;
    canvas.setPointerCapture(e.pointerId);
    panDrag = { ox: e.clientX, oy: e.clientY, vpx: vp.x, vpy: vp.y };
    canvas.style.cursor = 'grabbing';
    closeMenu();
  });
  canvas.addEventListener('pointermove', e => {
    if (!panDrag) return;
    vp.x = panDrag.vpx + (e.clientX - panDrag.ox);
    vp.y = panDrag.vpy + (e.clientY - panDrag.oy);
  });
  canvas.addEventListener('pointerup', () => { panDrag = null; canvas.style.cursor = ''; });

  wrapper.addEventListener('pointermove', e => {
    if (!connFrom) return;
    const wr = wrapper.getBoundingClientRect();
    connPos = { x: e.clientX - wr.left, y: e.clientY - wr.top };
  });
  wrapper.addEventListener('pointerup', e => {
    if (!connFrom) return;
    const wr = wrapper.getBoundingClientRect();
    finishConnect(connFrom, e.clientX - wr.left, e.clientY - wr.top);
  });

  /* ── Zoom ───────────────────────────────────────────────── */
  function doZoom(f) {
    const cx = canvasW()/2, cy = canvasH()/2;
    const ns = Math.max(0.2, Math.min(3, vp.scale * f));
    vp.x = cx - (cx - vp.x) * (ns / vp.scale);
    vp.y = cy - (cy - vp.y) * (ns / vp.scale);
    vp.scale = ns;
  }
  document.getElementById('cv-zi')?.addEventListener('click', () => doZoom(1.25));
  document.getElementById('cv-zo')?.addEventListener('click', () => doZoom(1/1.25));
  document.getElementById('cv-rst')?.addEventListener('click', () => { vp.x = canvasW()/2; vp.y = canvasH()/2; vp.scale = 1; });
  document.getElementById('cv-fs')?.addEventListener('click', () => {
    if (!document.fullscreenElement) wrapper.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
  });
  wrapper.addEventListener('wheel', e => {
    if (!document.fullscreenElement) return;
    e.preventDefault();
    const wr = wrapper.getBoundingClientRect();
    const mx = e.clientX - wr.left, my = e.clientY - wr.top;
    const f = e.deltaY < 0 ? 1.1 : 1/1.1;
    const ns = Math.max(0.2, Math.min(3, vp.scale * f));
    vp.x = mx - (mx - vp.x) * (ns / vp.scale);
    vp.y = my - (my - vp.y) * (ns / vp.scale);
    vp.scale = ns;
  }, { passive: false });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen(); });
  document.addEventListener('fullscreenchange', () => {
    setTimeout(resize, 50);
    const cursorEl = document.getElementById('cursor');
    if (!cursorEl) return;
    if (document.fullscreenElement) {
      document.fullscreenElement.appendChild(cursorEl);
    } else {
      document.body.appendChild(cursorEl);
    }
  });

  /* ── Sidebar ────────────────────────────────────────────── */
  const shopBtns = {};

  function renderShop() {
    const el = document.getElementById('csb-shop');
    if (!el) return;
    el.innerHTML = '';
    Object.keys(shopBtns).forEach(k => delete shopBtns[k]);
    Object.entries(DEFS).forEach(([type, def]) => {
      if (!def.unlocked) return;
      const [r,g,b] = def.col;
      const btn = document.createElement('button');
      btn.className = 'csb-item';
      btn.style.setProperty('--ic', `rgb(${r},${g},${b})`);
      btn.innerHTML = `
        <span class="csi-icon">${def.icon}</span>
        <span class="csi-info">
          <b>${def.name}</b>
          <small>${CAT_LABEL[def.cat]} · ${def.desc}</small>
        </span>
        <span class="csi-cost">${def.cost===0 ? 'Gratuit' : fmtN(def.cost)+'💰'}</span>`;
      btn.addEventListener('click', () => {
        if (argent < def.cost) return;
        argent -= def.cost;
        const { x, y } = s2w(canvasW()/2 + (Math.random()-0.5)*140, canvasH()/2 + (Math.random()-0.5)*80);
        addNode(type, x, y);
      });
      el.appendChild(btn);
      shopBtns[type] = btn;
    });
    updateShopAffordability();
  }

  function updateShopAffordability() {
    Object.entries(shopBtns).forEach(([type, btn]) => {
      btn.classList.toggle('can', argent >= DEFS[type].cost);
    });
  }

  function renderChals() {
    const el = document.getElementById('csb-ch');
    if (!el) return;
    el.innerHTML = '';
    CHALS.forEach(c => {
      const div = document.createElement('div');
      div.className = `csc-item${c.done ? ' done' : ''}`;
      div.innerHTML = `
        <span class="csc-icon">${c.done ? '✓' : '○'}</span>
        <div><b>${c.title}</b><small>${c.desc}</small>${
          !c.done && c.reward ? `<span class="csc-reward">→ Débloque ${DEFS[c.reward]?.name || c.reward}</span>` : ''
        }</div>`;
      el.appendChild(div);
    });
  }

  function checkChals() {
    let changed = false;
    CHALS.forEach(c => {
      if (!c.done && c.check()) {
        c.done = true; changed = true;
        if (c.reward && DEFS[c.reward]) {
          DEFS[c.reward].unlocked = true;
          const csb = document.getElementById('csb');
          if (csb) { csb.classList.add('notif'); setTimeout(() => csb.classList.remove('notif'), 1400); }
        }
      }
    });
    if (changed) { renderChals(); renderShop(); }
  }

  function updateStats() {
    const dEl = document.getElementById('csb-data');
    const dps = document.getElementById('csb-dps');
    const mEl = document.getElementById('csb-money');
    const mps = document.getElementById('csb-mps');
    if (dEl) dEl.textContent = fmtN(totalData);
    if (dps) dps.textContent = `+${dataPerSec.toFixed(1)} / sec`;
    if (mEl) mEl.textContent = fmtN(argent);
    if (mps) mps.textContent = moneyPerSec > 0 ? `+${moneyPerSec.toFixed(2)} / sec` : '+0 / sec';
    updateShopAffordability();
  }

  /* ── Main loop ──────────────────────────────────────────── */
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    animT   += dt;
    totalData += dataPerSec  * dt;
    argent    += moneyPerSec * dt;
    tickAttacks(dt);
    if (Math.floor(animT * 2) !== Math.floor((animT - dt) * 2)) {
      checkChals(); updateStats();
    }
    draw();
    requestAnimationFrame(loop);
  }

  /* ── Init ───────────────────────────────────────────────── */
  resize();
  new ResizeObserver(resize).observe(wrapper);

  /* ── Hide custom cursor inside game zone ── */
  wrapper.addEventListener('mouseenter', () => document.body.classList.add('cursor-canvas'));
  wrapper.addEventListener('mouseleave', () => document.body.classList.remove('cursor-canvas'));

  requestAnimationFrame(() => {
    vp.x = canvasW() / 2;
    vp.y = canvasH() / 2;
    addNode('pc', 0, 0);
    renderChals();
    renderShop();
    updateStats();
    requestAnimationFrame(loop);
  });
}

// ─────────────────────────────────────────────
// Hero distortion effect (SVG feTurbulence on hover)
// ─────────────────────────────────────────────
function initHeroDistortion() {
  const wrap  = document.querySelector('.hero-title-wrap');
  const title = document.querySelector('.hero-title');
  if (!wrap || !title) return;

  const chars = [...title.querySelectorAll('.hero-char')];
  if (!chars.length) return;

  // Per-char spring state: [tx,ty, scale, rot, skx, sky,  vtx,vty,vsc,vrot,vskx,vsky]
  const S = chars.map(() => [0,0, 1, 0, 0,0,  0,0,0,0,0,0]);

  let mx = -9999, my = -9999, hover = false, raf = null, last = 0, hP = 0;

  const K = 160, D = 20, R = 320; // spring stiffness/damping, influence radius

  function spring(cur, vel, tgt, dt) {
    const v = vel + ((tgt - cur) * K - vel * D) * dt;
    return [cur + v * dt, v];
  }

  function tick(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    hP = Math.max(0, Math.min(1, hP + (hover ? 5 : -6) * dt));

    let busy = hP > 0.005;

    chars.forEach((el, i) => {
      const s = S[i];
      const r   = el.getBoundingClientRect();
      const cx  = r.left + r.width * 0.5;
      const cy  = r.top  + r.height * 0.5;
      const dx  = mx - cx, dy = my - cy;
      const d   = Math.hypot(dx, dy) || 1;
      const infl = hover ? Math.pow(Math.max(0, 1 - d / R), 1.6) * hP : 0;

      // Targets — at max influence: letter collapses to cursor point
      const tTx  = dx * infl * 0.97;
      const tTy  = dy * infl * 0.97;
      const tSc  = 1 - infl * 0.97;          // scale → 0.03
      const tRot = infl * (360 * 2 + i * 15); // 2+ full turns, staggered per char
      const tSkX = (dx / d) * infl * 55;      // shear toward cursor
      const tSkY = (dy / d) * infl * 30;

      [s[0],s[6]]  = spring(s[0], s[6],  tTx,  dt);
      [s[1],s[7]]  = spring(s[1], s[7],  tTy,  dt);
      [s[2],s[8]]  = spring(s[2], s[8],  tSc,  dt);
      [s[3],s[9]]  = spring(s[3], s[9],  tRot, dt);
      [s[4],s[10]] = spring(s[4], s[10], tSkX, dt);
      [s[5],s[11]] = spring(s[5], s[11], tSkY, dt);

      const sc = Math.max(0.001, s[2]);
      el.style.transform =
        `translate(${s[0].toFixed(2)}px,${s[1].toFixed(2)}px)` +
        ` scale(${sc.toFixed(4)})` +
        ` rotate(${s[3].toFixed(2)}deg)` +
        ` skewX(${s[4].toFixed(2)}deg)` +
        ` skewY(${s[5].toFixed(2)}deg)`;

      const vel = Math.abs(s[6])+Math.abs(s[7])+Math.abs(s[8])+Math.abs(s[9]);
      if (vel > 0.02) busy = true;
    });

    if (busy || hover) {
      raf = requestAnimationFrame(tick);
    } else {
      chars.forEach(el => el.style.transform = '');
      raf = null;
    }
  }

  function go() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  wrap.addEventListener('mouseenter', e => { hover = true;  mx = e.clientX; my = e.clientY; go(); });
  wrap.addEventListener('mouseleave', () => { hover = false; mx = -9999;     my = -9999;     go(); });
  wrap.addEventListener('mousemove',  e => { mx = e.clientX; my = e.clientY; });
}

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────
async function init() {
  initGrain();
  initCursor();
  splitHeroChars();
  initThemeSwitcher();
  _navUpdate  = initNavSplitText();
  threeScene  = initThreeHero();

  await initPreloader();

  const lenis = initLenis();
  animateHero();
  initScrollAnimations();
  initParallax();
  initTicker();
  initProjectInteractions();
  initProjectPreview();
  initCanvasSection();
  initHeroDistortion();
  initMagnetic();
  initContactForm();
  initAnchorScroll(lenis);
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
