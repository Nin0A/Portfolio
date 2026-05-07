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
  const dot    = document.getElementById('cursor-dot');
  const ring   = document.getElementById('cursor-ring');
  const cursor = document.getElementById('cursor');
  let mx = 0, my = 0, rx = 0, ry = 0;

  // Label inside ring (shown when cursor-project is active)
  const label = document.createElement('span');
  label.id = 'cursor-label';
  ring.appendChild(label);

  // Trail dots — inside #cursor so they share its fixed stacking context
  const TRAIL_N = 6;
  const trail = Array.from({ length: TRAIL_N }, (_, i) => {
    const d = document.createElement('div');
    d.className = 'cursor-trail';
    cursor.appendChild(d);
    return { el: d, x: 0, y: 0, lag: 0.20 - i * 0.022 };
  });

  let trailReady = false;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.set(dot, { x: mx, y: my });
    if (!trailReady) {
      trailReady = true;
      trail.forEach((t, i) => {
        t.x = mx; t.y = my;
        gsap.to(t.el, { opacity: 0.28 - i * 0.04, duration: 0.6, delay: i * 0.05 });
      });
    }
  });

  (function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    gsap.set(ring, { x: rx, y: ry });

    // Each trail dot chases the previous with increasing lag
    let px = rx, py = ry;
    trail.forEach(t => {
      t.x += (px - t.x) * t.lag;
      t.y += (py - t.y) * t.lag;
      gsap.set(t.el, { x: t.x, y: t.y });
      px = t.x; py = t.y;
    });

    requestAnimationFrame(animateRing);
  })();

  document.addEventListener('mouseenter', () => document.body.classList.remove('cursor-hidden'));
  document.addEventListener('mouseleave', () => document.body.classList.add('cursor-hidden'));

  // Generic hover — a/button only; .project-item uses cursor-project (set in initProjectInteractions)
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave',  () => document.body.classList.remove('cursor-hover'));
  });
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
    try { return new THREE.Color(raw); } catch { return new THREE.Color('#c9f565'); }
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
// Canvas — réseau de données / IA (incremental)
// ─────────────────────────────────────────────
function initCanvasSection() {
  const wrapper  = document.getElementById('canvas-wrapper');
  const canvas   = document.getElementById('infinite-canvas');
  const nodesDiv = document.getElementById('canvas-nodes');
  if (!wrapper || !canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Block definitions ─────────────────────────────────────
     cat: 'col' = collecteur  |  'proc' = processeur  |  'mon' = monétiseur
     accepts: which categories can feed this block (null = no inputs)
     bm: bonus multiplier — col: unused | proc: output = influx*bm | mon: argent = influx*bm
  ─────────────────────────────────────────────────────────── */
  const DEFS = {
    sensor:     { icon:'🌐', name:'Capteur Web',    cat:'col', col:[96,165,250],   base:2,  bm:0,    cost:0,    unlocked:true,  accepts:null,              desc:'+2 données/sec' },
    iot:        { icon:'📡', name:'Antenne IoT',    cat:'col', col:[52,211,153],   base:5,  bm:0,    cost:150,  unlocked:false, accepts:null,              desc:'+5 données/sec' },
    satellite:  { icon:'🛰️', name:'Satellite',     cat:'col', col:[167,139,250],  base:15, bm:0,    cost:2000, unlocked:false, accepts:null,              desc:'+15 données/sec' },
    aggregator: { icon:'🔗', name:'Agrégateur',    cat:'proc', col:[201,245,101],  base:0,  bm:1.5,  cost:100,  unlocked:false, accepts:['col'],           desc:'×1.5 par flux entrant (capteurs)' },
    ai:         { icon:'🧠', name:'Modèle IA',     cat:'proc', col:[245,158,11],   base:0,  bm:2.5,  cost:800,  unlocked:false, accepts:['col','proc'],    desc:'×2.5 par flux entrant' },
    api:        { icon:'💸', name:'API Market',    cat:'mon',  col:[232,121,249],  base:0,  bm:0.15, cost:200,  unlocked:false, accepts:['col','proc'],    desc:'Vend les données → 0.15 💰/donnée' },
    fund:       { icon:'🏦', name:'Fonds Data',    cat:'mon',  col:[251,191,36],   base:0,  bm:0.4,  cost:3500, unlocked:false, accepts:['col','proc','mon'],desc:'Investissement → 0.4 💰/donnée' },
  };

  const CAT_LABEL = { col: 'COLLECTEUR', proc: 'PROCESSEUR', mon: 'MONÉTISEUR' };

  /* ── Challenges ─────────────────────────────────────────── */
  const CHALS = [
    { id:'c1', title:'Collecte initiale', desc:'Accumuler 10 données',    done:false, reward:'aggregator', check:()=>totalData>=10 },
    { id:'c2', title:'Réseau connecté',   desc:'Créer une connexion',     done:false, reward:'api',        check:()=>edges.length>=1 },
    { id:'c3', title:'100 données',       desc:'Accumuler 100 données',   done:false, reward:'iot',        check:()=>totalData>=100 },
    { id:'c4', title:'Bien connecté',     desc:'Avoir 5 connexions',      done:false, reward:'ai',         check:()=>edges.length>=5 },
    { id:'c5', title:'1 000 données',     desc:'Accumuler 1 000 données', done:false, reward:'satellite',  check:()=>totalData>=1000 },
    { id:'c6', title:'500 argent',        desc:'Avoir 500 argent',        done:false, reward:'fund',       check:()=>argent>=500 },
  ];

  /* ── State ─────────────────────────────────────────────── */
  const vp    = { x: 0, y: 0, scale: 1 };
  const nodes = [];
  const edges = [];
  let nodeSeq = 0, edgeSeq = 0;
  let totalData = 0, dataPerSec = 0;
  let argent = 500, moneyPerSec = 0; // start with seed funding
  let animT = 0, lastTs = 0;

  let panDrag = null, nodeDrag = null;
  let connFrom = null, connPos = null;
  let openMenuId = null;

  const NW = 160, GRID = 40, CSB_W = 220;

  /* ── Helpers ────────────────────────────────────────────── */
  function w2s(wx, wy) { return { x: wx * vp.scale + vp.x, y: wy * vp.scale + vp.y }; }
  function s2w(sx, sy) { return { x: (sx - vp.x) / vp.scale, y: (sy - vp.y) / vp.scale }; }
  function outP(n) { const s = w2s(n.x, n.y); return { x: s.x + NW/2 * vp.scale, y: s.y }; }
  function inP(n)  { const s = w2s(n.x, n.y); return { x: s.x - NW/2 * vp.scale, y: s.y }; }
  function fmtN(n) {
    n = Math.floor(n);
    if (n < 1000) return String(n);
    if (n < 1e6)  return (n/1000).toFixed(1).replace('.0','')+'K';
    return (n/1e6).toFixed(1).replace('.0','')+'M';
  }
  function canvasW() { return canvas.width - CSB_W; }

  /* ── Resize ─────────────────────────────────────────────── */
  function resize() { canvas.width = wrapper.clientWidth; canvas.height = wrapper.clientHeight; }

  /* ── Rate computation (topological passes) ──────────────── */
  function reRates() {
    nodes.forEach(n => { n.dps = 0; n.mps = 0; });

    // Pass 1: collectors produce independently
    nodes.filter(n => DEFS[n.type].cat === 'col').forEach(n => { n.dps = DEFS[n.type].base; });

    // Passes 2-4: processors (handles proc→proc chains up to depth 3)
    for (let p = 0; p < 3; p++) {
      nodes.filter(n => DEFS[n.type].cat === 'proc').forEach(n => {
        const influx = edges.filter(e => e.to === n.id)
          .reduce((s, e) => s + (nodes.find(nd => nd.id === e.from)?.dps || 0), 0);
        n.dps = influx > 0 ? influx * DEFS[n.type].bm : 0;
      });
    }

    // Pass 5: monetizers convert data flow → money
    nodes.filter(n => DEFS[n.type].cat === 'mon').forEach(n => {
      const influx = edges.filter(e => e.to === n.id)
        .reduce((s, e) => s + (nodes.find(nd => nd.id === e.from)?.dps || 0), 0);
      n.mps = influx * DEFS[n.type].bm;
    });

    dataPerSec  = nodes.reduce((s, n) => s + (n.dps || 0), 0);
    moneyPerSec = nodes.reduce((s, n) => s + (n.mps || 0), 0);
  }

  /* ── Connection validation ──────────────────────────────── */
  function canConnect(fromId, toId) {
    const fromNode = nodes.find(n => n.id === fromId);
    const toNode   = nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) return false;
    const acc = DEFS[toNode.type].accepts;
    if (acc === null) return false; // target accepts no inputs
    return acc.includes(DEFS[fromNode.type].cat);
  }

  function flashError(nodeId) {
    const el = document.getElementById(`cn-${nodeId}`);
    if (!el) return;
    el.classList.add('error');
    setTimeout(() => el.classList.remove('error'), 500);
  }

  /* ── Draw ───────────────────────────────────────────────── */
  function draw() {
    const W = canvasW(), H = canvas.height;
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

    // Edges
    edges.forEach(edge => {
      const fn = nodes.find(n => n.id === edge.from);
      const tn = nodes.find(n => n.id === edge.to);
      if (!fn || !tn) return;
      const fp = outP(fn), tp = inP(tn);
      const cpx = Math.max(Math.abs(tp.x - fp.x) * 0.5, 50);
      const isMonEdge = DEFS[fn.type].cat === 'mon';
      const [r,g,b] = isMonEdge ? [251,191,36] : DEFS[fn.type].col;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(fp.x, fp.y);
      ctx.bezierCurveTo(fp.x+cpx, fp.y, tp.x-cpx, tp.y, tp.x, tp.y);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`;
      ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fp.x, fp.y);
      ctx.bezierCurveTo(fp.x+cpx, fp.y, tp.x-cpx, tp.y, tp.x, tp.y);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 13]);
      ctx.lineDashOffset = -(animT * 38);
      ctx.stroke();
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

    // Sync node DOM positions + rate labels
    nodes.forEach(n => {
      const el = document.getElementById(`cn-${n.id}`);
      if (!el) return;
      const s = w2s(n.x, n.y);
      el.style.left      = `${s.x}px`;
      el.style.top       = `${s.y}px`;
      el.style.transform = `translate(-50%,-50%) scale(${vp.scale})`;
      const rEl = el.querySelector('.node-rate');
      if (rEl) {
        const def = DEFS[n.type];
        if (def.cat === 'mon') rEl.textContent = n.mps > 0 ? `+${n.mps.toFixed(2)}💰/s` : '0💰/s';
        else                   rEl.textContent = n.dps > 0 ? `+${n.dps.toFixed(1)}📊/s`  : `+${def.base}📊/s`;
      }
    });
  }

  /* ── addNode ────────────────────────────────────────────── */
  function addNode(type, wx, wy) {
    const def = DEFS[type];
    if (!def || !def.unlocked) return null;
    nodeSeq++;
    const id = nodeSeq;
    nodes.push({ id, type, x: wx, y: wy, dps: def.base, mps: 0 });

    const [r,g,b] = def.col;
    const el = document.createElement('div');
    el.className = 'canvas-node';
    el.id = `cn-${id}`;
    el.style.setProperty('--node-color', `rgb(${r},${g},${b})`);
    el.innerHTML = `
      <div class="node-port node-port-in"></div>
      <div class="node-body">
        <span class="node-icon">${def.icon}</span>
        <div class="node-info">
          <span class="node-name">${def.name}</span>
          <span class="node-rate">+${def.base}📊/s</span>
        </div>
      </div>
      <div class="node-port node-port-out"></div>
      <button class="node-dots" aria-label="Options">⋯</button>
      <div class="node-menu">
        <button class="ndm-item" data-action="rename">✏️ Renommer</button>
        <button class="ndm-item danger" data-action="delete">🗑️ Supprimer</button>
      </div>
      <span class="node-cat">${CAT_LABEL[def.cat]}</span>`;
    nodesDiv.appendChild(el);

    const body    = el.querySelector('.node-body');
    const portOut = el.querySelector('.node-port-out');
    const portIn  = el.querySelector('.node-port-in');
    const dotsBtn = el.querySelector('.node-dots');
    const menuEl  = el.querySelector('.node-menu');

    // Drag
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

    // Output port — start connection drag
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

    // Input port — receive drop
    portIn.addEventListener('pointerup', e => {
      if (connFrom === null || connFrom === id) return;
      e.stopPropagation();
      tryConnect(connFrom, id);
      connFrom = null; connPos = null;
    });

    // 3-dots menu
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
        if (btn.dataset.action === 'rename') {
          const nameEl = el.querySelector('.node-name');
          const v = prompt('Nouveau nom :', nameEl.textContent);
          if (v && v.trim()) nameEl.textContent = v.trim();
        } else if (btn.dataset.action === 'delete') {
          removeNode(id);
        }
      });
    });

    [el, portOut, portIn, dotsBtn].forEach(b => {
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

  /* ── Zoom (buttons always, scroll only fullscreen) ───────── */
  function doZoom(f) {
    const cx = canvasW()/2, cy = canvas.height/2;
    const ns = Math.max(0.2, Math.min(3, vp.scale * f));
    vp.x = cx - (cx - vp.x) * (ns / vp.scale);
    vp.y = cy - (cy - vp.y) * (ns / vp.scale);
    vp.scale = ns;
  }
  document.getElementById('cv-zi')?.addEventListener('click', () => doZoom(1.25));
  document.getElementById('cv-zo')?.addEventListener('click', () => doZoom(1/1.25));
  document.getElementById('cv-rst')?.addEventListener('click', () => {
    vp.x = canvasW()/2; vp.y = canvas.height/2; vp.scale = 1;
  });
  document.getElementById('cv-fs')?.addEventListener('click', () => {
    if (!document.fullscreenElement) wrapper.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
  });

  wrapper.addEventListener('wheel', e => {
    if (!document.fullscreenElement) return;
    e.preventDefault();
    const wr = wrapper.getBoundingClientRect();
    const mx = e.clientX - wr.left, my = e.clientY - wr.top;
    const f  = e.deltaY < 0 ? 1.1 : 1/1.1;
    const ns = Math.max(0.2, Math.min(3, vp.scale * f));
    vp.x = mx - (mx - vp.x) * (ns / vp.scale);
    vp.y = my - (my - vp.y) * (ns / vp.scale);
    vp.scale = ns;
  }, { passive: false });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
  });
  document.addEventListener('fullscreenchange', () => setTimeout(resize, 50));

  /* ── Sidebar ────────────────────────────────────────────── */
  function renderShop() {
    const el = document.getElementById('csb-shop');
    if (!el) return;
    el.innerHTML = '';
    Object.entries(DEFS).forEach(([type, def]) => {
      if (!def.unlocked) return;
      const [r,g,b] = def.col;
      const can = argent >= def.cost;
      const btn = document.createElement('button');
      btn.className = `csb-item${can ? ' can' : ''}`;
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
        const { x, y } = s2w(
          canvasW()/2 + (Math.random()-0.5)*140,
          canvas.height/2 + (Math.random()-0.5)*80
        );
        addNode(type, x, y);
      });
      btn.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      btn.addEventListener('mouseleave',  () => document.body.classList.remove('cursor-hover'));
      el.appendChild(btn);
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
    renderShop();
  }

  /* ── Main loop ──────────────────────────────────────────── */
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    animT   += dt;
    totalData += dataPerSec  * dt;
    argent    += moneyPerSec * dt;
    if (Math.floor(animT * 2) !== Math.floor((animT - dt) * 2)) {
      checkChals(); updateStats();
    }
    draw();
    requestAnimationFrame(loop);
  }

  /* ── Init ───────────────────────────────────────────────── */
  resize();
  new ResizeObserver(resize).observe(wrapper);

  requestAnimationFrame(() => {
    vp.x = canvasW() / 2;
    vp.y = canvas.height / 2;
    addNode('sensor', 0, 0);
    renderChals();
    renderShop();
    updateStats();
    requestAnimationFrame(loop);
  });
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
  initMagnetic();
  initContactForm();
  initAnchorScroll(lenis);
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
