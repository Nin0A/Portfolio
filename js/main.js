/* ============================================================
   PORTFOLIO — main.js
   Stack: Three.js · GSAP ScrollTrigger · Lenis  (bundled via Vite)
   ============================================================ */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

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
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
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
// Three.js Hero — wireframe icosahedra + 2 500 shader particles
// ─────────────────────────────────────────────
let threeScene = null;

// Simplex noise (Ashima Arts, MIT) inlined in GLSL
const _NOISE_GLSL = /* glsl */`
  vec3 _m289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 _m289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 _perm(vec4 x){return _m289v4(((x*34.)+1.)*x);}
  vec4 _tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=_m289v3(i);
    vec4 p=_perm(_perm(_perm(
      i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=_tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

const _PARTICLE_VERT = /* glsl */`
  ${_NOISE_GLSL}
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uDPR;
  attribute float aSize;
  attribute float aPhase;
  varying float vAlpha;
  void main(){
    vec3 p=position;
    float t=uTime*.12+aPhase*6.283;
    float s=.28;
    p.x+=snoise(vec3(p.x*s,      p.y*s,      t      ))*.65;
    p.y+=snoise(vec3(p.x*s+17.3, p.y*s+31.7, t+1.5  ))*.65;
    p.z+=snoise(vec3(p.x*s+43.1, p.y*s+67.9, t+3.0  ))*.4;
    vec2 diff=p.xy-uMouse;
    float dist=length(diff);
    p.xy+=normalize(diff+.001)*smoothstep(2.4,0.,dist)*1.6;
    float edge=length(p.xy/vec2(9.,6.5));
    vAlpha=smoothstep(1.3,.3,edge)*.9;
    vec4 mv=modelViewMatrix*vec4(p,1.);
    gl_PointSize=aSize*uDPR*(52./-mv.z);
    gl_Position=projectionMatrix*mv;
  }
`;

const _PARTICLE_FRAG = /* glsl */`
  uniform vec3 uColor;
  varying float vAlpha;
  void main(){
    float d=length(gl_PointCoord-.5);
    float a=smoothstep(.5,.06,d)*vAlpha;
    if(a<.005)discard;
    gl_FragColor=vec4(uColor,a);
  }
`;

function initThreeHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  function readAccent() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    try { return new THREE.Color(raw); } catch { return new THREE.Color('#4da6ff'); }
  }

  // ── Wireframe icosahedra ──────────────────────────────────
  const icoMats = [];
  function makeIco(radius, detail, x, y, z, opacity) {
    const mat = new THREE.MeshBasicMaterial({
      color: readAccent(), wireframe: true, transparent: true, opacity,
    });
    icoMats.push(mat);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, detail), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }
  const icoA = makeIco(2.6, 1, 3.5, 0.8, -1, 0.08);
  const icoB = makeIco(1.4, 1, -4.5, -1.5, -2, 0.06);
  const icoC = makeIco(0.5, 0, -1.5, 2.0, 1, 0.35);

  // ── Shader particles with GLSL noise flow field ───────────
  const COUNT = 1200;
  const posArr = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const phases = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    posArr[i * 3] = (Math.random() - 0.5) * 18;
    posArr[i * 3 + 1] = (Math.random() - 0.5) * 13;
    posArr[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    sizes[i] = Math.random() * 1.8 + 0.4;
    phases[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  pGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const pMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 9999) },
      uColor: { value: readAccent() },
      uDPR: { value: renderer.getPixelRatio() },
    },
    vertexShader: _PARTICLE_VERT,
    fragmentShader: _PARTICLE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  // ── Mouse: parallax + particle repulsion ──────────────────
  let targetMX = 0, targetMY = 0, camX = 0, camY = 0, scrollY = 0;

  document.addEventListener('mousemove', e => {
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    targetMX = (nx - 0.5) * 2;
    targetMY = (ny - 0.5) * 2;
    // Convert to world-space for the particle repulsion uniform
    const fovH = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z;
    pMat.uniforms.uMouse.value.set(
      (nx - 0.5) * fovH * camera.aspect,
      -(ny - 0.5) * fovH,
    );
  });

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    pMat.uniforms.uDPR.value = renderer.getPixelRatio();
  });

  // ── Render loop ───────────────────────────────────────────
  const t0 = performance.now();
  (function animate() {
    requestAnimationFrame(animate);

    pMat.uniforms.uTime.value = (performance.now() - t0) * 0.001;

    icoA.rotation.x += 0.0025; icoA.rotation.y += 0.004;
    icoB.rotation.x -= 0.003; icoB.rotation.y -= 0.002;
    icoC.rotation.x += 0.006; icoC.rotation.z += 0.004;

    camX += (targetMX * 0.55 - camX) * 0.04;
    camY += (targetMY * -0.35 - camY) * 0.04;
    camera.position.x = camX;
    camera.position.y = camY;
    camera.position.z = 7 + scrollY * 0.004;

    renderer.render(scene, camera);
  })();

  // ── Update colors on theme change ─────────────────────────
  function updateColors() {
    const c = readAccent();
    icoMats.forEach(m => { m.color = c; });
    pMat.uniforms.uColor.value.copy(c);
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
// Ticker — pure CSS animation, pause on hover
// ─────────────────────────────────────────────
function initTicker() {
  const wrap = document.querySelector('.hero-ticker');
  const track = document.querySelector('.ticker-track');
  if (!track || !wrap) return;

  wrap.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
  wrap.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
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
    const el = document.getElementById('preloader');
    const bar = document.querySelector('.preloader-bar');
    const num = document.getElementById('preloader-num');
    const chars = el.querySelectorAll('.pl-char');
    const oItems = el.querySelectorAll('.pl-o');

    // Initial states
    gsap.set(chars, { opacity: 0, y: 50 });
    gsap.set([...oItems].slice(1), { yPercent: 110 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(el, {
          yPercent: -100, duration: 0.9, ease: 'power4.inOut', delay: 0.15,
          onComplete() {
            el.style.display = 'none';
            document.body.classList.remove('is-loading');
            resolve();
          }
        });
      }
    });

    // Letters appear one by one
    tl.to(chars, {
      opacity: 1, y: 0,
      duration: 0.55, ease: 'power3.out',
      stagger: 0.1
    });

    // O slot machine: each variant rises from below, previous exits upward
    oItems.forEach((item, i) => {
      if (i === 0) return;
      tl.to(oItems[i - 1], { yPercent: -110, duration: 0.28, ease: 'power2.in' }, '+=0.18')
        .to(item, { yPercent: 0, duration: 0.28, ease: 'power2.out' }, '<0.05');
    });

    tl.to({}, { duration: 0.2 });

    // Progress bar + counter synced to timeline
    const totalMs = tl.totalDuration() * 1000 + 1100;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / totalMs, 1);
      bar.style.width = `${p * 100}%`;
      num.textContent = String(Math.floor(p * 100)).padStart(2, '0');
      if (p < 1) requestAnimationFrame(step);
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
    gsap.to(el, {
      opacity: 1, duration: 0.8,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // Reveal up
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      }
    );
  });

  // Stats counter
  gsap.utils.toArray('.stat-item').forEach(item => {
    const numEl = item.querySelector('.stat-num');
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
        gsap.to(bar, {
          width: `${bar.dataset.width}%`, duration: 1.3,
          delay: i * 0.07 + 0.15, ease: 'power3.out'
        });
      }
    });
  });

  // Project items — alternate slide from left/right
  gsap.utils.toArray('.project-item').forEach((item, i) => {
    const dir = i % 2 === 0 ? -80 : 80;
    gsap.fromTo(item,
      { opacity: 0, x: dir },
      {
        opacity: 1, x: 0, duration: 0.85, delay: i * 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 88%' }
      }
    );
  });
}

// ─────────────────────────────────────────────
// Project hover preview — WebGL shader distortion
// Plane in orthographic scene, simplex noise UV displacement:
// enter → distortion 1→0 (image materialises), leave → 0→1 + alpha fade
// ─────────────────────────────────────────────
function initProjectWebGL() {
  const items = [...document.querySelectorAll('.project-item[data-preview]')];
  if (!items.length || window.innerWidth <= 768) return;

  // Single renderer shared across all items — avoids N WebGL contexts
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:block';
  document.body.appendChild(canvas);

  let W = window.innerWidth, H = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(1); // DPR 1 for perf — project bg doesn't need retina
  renderer.setSize(W, H);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 10);
  camera.position.z = 1;

  // Single snoise call keeps fragment shader cheap
  const frag = /* glsl */`
    ${_NOISE_GLSL}
    uniform sampler2D uTex;
    uniform float uDisp;
    uniform float uAlpha;
    uniform float uTime;
    uniform float uAR;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      if (uAR < 1.0) {
        uv.y = 0.5 + (vUv.y - 0.5) * uAR;
      } else {
        uv.x = 0.5 + (vUv.x - 0.5) / uAR;
      }
      float n = snoise(vec3(uv * 3.0, uTime * 0.15 + uDisp));
      vec2 d = vec2(n, n * 0.65) * uDisp * 0.12;
      vec4 col = texture2D(uTex, clamp(uv + d, 0.0, 1.0));
      gl_FragColor = vec4(col.rgb * 0.42, col.a * uAlpha);
    }
  `;

  const vert = /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: null },
      uDisp: { value: 1.0 },
      uAlpha: { value: 0.0 },
      uTime: { value: 0.0 },
      uAR: { value: 1.0 },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  scene.add(mesh);

  const loader = new THREE.TextureLoader();
  const texCache = {};
  items.forEach(item => {
    const src = item.dataset.preview;
    if (src && !texCache[src]) {
      const t = loader.load(src);
      t.colorSpace = THREE.SRGBColorSpace;
      texCache[src] = t;
    }
  });

  let activeItem = null, targetDisp = 1.0, targetAlpha = 0.0, rafId = null;
  const t0 = performance.now();

  function syncMesh() {
    if (!activeItem) return;
    const r = activeItem.getBoundingClientRect();
    mesh.position.set(r.left + r.width / 2 - W / 2, H / 2 - r.top - r.height / 2, 0);
    mesh.scale.set(r.width, r.height, 1);
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    mat.uniforms.uTime.value = (performance.now() - t0) * 0.001;
    mat.uniforms.uDisp.value += (targetDisp - mat.uniforms.uDisp.value) * 0.07;
    mat.uniforms.uAlpha.value += (targetAlpha - mat.uniforms.uAlpha.value) * 0.09;
    if (targetAlpha < 0.005 && mat.uniforms.uAlpha.value < 0.005) {
      renderer.clear();
      cancelAnimationFrame(rafId);
      rafId = null;
      return;
    }
    syncMesh();
    renderer.clear();
    renderer.render(scene, camera);
  }

  items.forEach(item => {
    item.addEventListener('mouseenter', () => {
      activeItem = item;
      const tex = texCache[item.dataset.preview];
      if (tex) {
        mat.uniforms.uTex.value = tex;
        const img = tex.image;
        if (img && img.width) {
          const r = item.getBoundingClientRect();
          mat.uniforms.uAR.value = (img.width / img.height) / (r.width / r.height);
        }
      }
      targetDisp = 0.0; targetAlpha = 1.0;
      if (!rafId) loop();
    });
    item.addEventListener('mouseleave', () => {
      targetDisp = 1.0; targetAlpha = 0.0;
    });
  });

  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H);
    camera.left = -W / 2; camera.right = W / 2;
    camera.top = H / 2; camera.bottom = -H / 2;
    camera.updateProjectionMatrix();
  }, { passive: true });
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
  if (_navUpdate) requestAnimationFrame(_navUpdate);
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
  const msg = document.getElementById('form-success');
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
// Parcours — horizontal pinned timeline
// ─────────────────────────────────────────────
function initTimeline(lenis) {
  const section = document.getElementById('parcours');
  if (!section || typeof gsap === 'undefined') return;

  const track = section.querySelector('.tl-track');
  const railFill = section.querySelector('.tl-rail-fill');
  const yearNum = section.querySelector('.tl-year-num');
  const items = [...section.querySelectorAll('.tl-item')];
  const dots = items.map(el => el.querySelector('.tl-dot'));
  const cards = items.map(el => el.querySelector('.tl-card'));
  const tags = items.map(el => el.querySelector('.tl-tag'));
  if (!track || !items.length) return;

  const yearStarts = items.map(el => parseInt(el.dataset.yearStart, 10) || 2019);
  const DISP_MIN = Math.min(...yearStarts) - 1; // 2018
  const DISP_MAX = Math.max(...yearStarts) + 1; // 2026
  const DISP_RANGE = DISP_MAX - DISP_MIN;         // 8

  // thresholds: card i appears when step === its year index
  const thresholds = yearStarts.map(y => (y - DISP_MIN) / DISP_RANGE);

  // Force hidden
  gsap.set(items, { opacity: 0, y: 32 });
  gsap.set(dots, { scale: 0 });

  // Mobile: simple stagger, no wheel capture
  if (window.innerWidth <= 768) {
    gsap.set(items, { clearProps: 'all' });
    gsap.set(dots, { clearProps: 'all' });
    items.forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 82%', once: true },
          delay: i * 0.15
        }
      );
    });
    return;
  }

  // ── State ────────────────────────────────────────────
  const STEPS = DISP_RANGE;          // 8 steps (one per year)
  let step = 0;
  let active = false;               // true = section has focus, wheel captured
  const shown = items.map(() => false);

  // ── Apply a step (0…STEPS) ────────────────────────────
  function applyStep(s, instant) {
    const p = s / STEPS;
    const dur = instant ? 0 : 0.45;

    // Year counter
    if (yearNum) yearNum.textContent = Math.round(DISP_MIN + p * DISP_RANGE);

    // Determine which card is "current" (last revealed) — needed for rail fill
    let lastShown = -1;
    items.forEach((_, i) => { if (p >= thresholds[i]) lastShown = i; });

    // Rail fill: animate width to the center-x of the last revealed dot so
    // the blue bar stops exactly on the dot, never past it.
    if (railFill) {
      const fillPx = lastShown >= 0 ? items[lastShown].offsetLeft + 7 : 0;
      gsap.to(railFill, { width: fillPx, duration: dur, ease: 'power2.out' });
    }

    // Track translate
    const maxX = Math.max(1, track.scrollWidth - window.innerWidth);
    gsap.to(track, { x: -p * maxX, duration: dur, ease: 'power2.out' });

    items.forEach((item, i) => {
      const shouldShow = p >= thresholds[i];
      const isCurrent = i === lastShown;

      // Dynamic "current event" styling — follows the last revealed card
      if (cards[i]) cards[i].classList.toggle('tl-card--current', isCurrent);
      if (tags[i]) tags[i].classList.toggle('tl-tag--active', isCurrent);
      if (dots[i]) dots[i].classList.toggle('tl-dot--active', isCurrent);

      if (shouldShow && !shown[i]) {
        shown[i] = true;
        gsap.killTweensOf([item, dots[i]]);
        gsap.to(dots[i], { scale: 1, duration: 0.35, ease: 'back.out(2.8)' });
        gsap.to(item, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.06 });
      } else if (!shouldShow && shown[i]) {
        shown[i] = false;
        gsap.killTweensOf([item, dots[i]]);
        gsap.to(dots[i], { scale: 0, duration: 0.25, ease: 'power2.in' });
        gsap.to(item, { opacity: 0, y: 32, duration: 0.35, ease: 'power2.in' });
      }
    });
  }

  // ── Wheel handler (capture phase, before Lenis) ───────
  // We compare window.scrollY to section.offsetTop — much more reliable than
  // getBoundingClientRect during a Lenis animation (which is mid-lerp and off).
  let blocked = false;
  let blockDir = 0;
  let scrollingToSection = false;
  const SNAP_TOLERANCE = 150; // px — how close scrollY must be to section top

  function isCovering() {
    const scrollY = window.scrollY;
    const st = section.offsetTop;
    return scrollY >= st - SNAP_TOLERANCE && scrollY <= st + SNAP_TOLERANCE;
  }

  function onWheel(e) {
    const covering = isCovering();
    const dir = e.deltaY > 0 ? 1 : -1;

    if (blocked) {
      if (dir !== blockDir || !covering) blocked = false;
      if (blocked) return;
    }

    // Block wheel during the smooth approach scroll
    if (scrollingToSection) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    if (!covering) {
      if (active) { active = false; if (lenis) lenis.start(); }
      return;
    }

    if (!active) {
      // Smooth scroll to section top, then lock — no abrupt snap
      scrollingToSection = true;
      if (lenis) {
        lenis.scrollTo(section.offsetTop, {
          duration: 0.75,
          easing: t => 1 - Math.pow(1 - t, 3),
          onComplete: () => {
            scrollingToSection = false;
            lenis.stop();
            window.scrollTo(0, section.offsetTop);
            active = true;
          }
        });
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    const next = step + dir;

    if (next < 0 || next > STEPS) {
      active = false;
      blocked = true;
      blockDir = dir;
      if (lenis) lenis.start();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    step = next;
    applyStep(step);
  }
  window.addEventListener('wheel', onWheel, { passive: false, capture: true });

  // Init at step 0
  applyStep(0, true);
}

// ─────────────────────────────────────────────
// Passion — reveal photo columns on scroll
// ─────────────────────────────────────────────
function initPassion() {
  const section = document.getElementById('passion');
  if (!section || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const cols = section.querySelectorAll('.passion-col');
  cols.forEach((col, i) => {
    const dir = i === 1 ? 1 : -1; // middle col moves up, others down
    gsap.fromTo(col,
      { y: dir * 60, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
          delay: i * 0.12,
        },
        delay: i * 0.12,
      }
    );
  });
}



// ─────────────────────────────────────────────
// Project custom cursor — mix-blend-mode: difference
// ─────────────────────────────────────────────
function initProjectCursor() {
  const cursor = document.getElementById('project-cursor');
  if (!cursor) return;

  let mx = 0, my = 0;
  let targetScale = 0, currentScale = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%) scale(${currentScale})`;
  });

  document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      targetScale = 1;
      document.body.style.cursor = 'none';
    });
    item.addEventListener('mouseleave', () => {
      targetScale = 0;
      document.body.style.cursor = '';
    });
  });

  (function tick() {
    requestAnimationFrame(tick);
    currentScale += (targetScale - currentScale) * 0.3;
    cursor.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%) scale(${currentScale})`;
  })();
}

// ─────────────────────────────────────────────
// About — photo parallax
// ─────────────────────────────────────────────
function initAboutParallax() {
  const frame = document.querySelector('.about-photo-frame');
  const inner = document.querySelector('.about-photo-inner');
  if (!frame || !inner || typeof gsap === 'undefined') return;

  gsap.fromTo(inner,
    { yPercent: 10 },
    {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: {
        trigger: frame,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    }
  );
}

// ─────────────────────────────────────────────
// Page transition — slide right
// ─────────────────────────────────────────────
function initPageTransitions() {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);

  document.querySelectorAll('a.project-item--nearby').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.getAttribute('href');
      overlay.classList.add('slide-in');
      overlay.addEventListener('transitionend', () => {
        window.location.href = href;
      }, { once: true });
    });
  });
}

// Bootstrap
// ─────────────────────────────────────────────
async function init() {
  initGrain();
  initCursor();
  splitHeroChars();
  initThemeSwitcher();
  _navUpdate = initNavSplitText();
  threeScene = initThreeHero();

  await initPreloader();

  const lenis = initLenis();
  animateHero();
  initScrollAnimations();
  initParallax();
  initTicker();
  initProjectInteractions();
  initProjectWebGL();
  initProjectCursor();
  initTimeline(lenis);
  initPageTransitions();
  initAboutParallax();
  initPassion();
  initContactForm();
  initAnchorScroll(lenis);
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
