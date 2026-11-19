/* Mobile / touch layer. Safe to load on every page; everything is guarded.
   Desktop behaviour lives in main.js and is not touched. */
(() => {
'use strict';
const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const touch = root.classList.contains('is-touch');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const raf = window.requestAnimationFrame.bind(window);

/* ---------- failsafe (all devices): never leave content invisible ---------- */
if (!('IntersectionObserver' in window)) $$('.reveal,.t-reveal').forEach(e => e.classList.add('in'));
setTimeout(() => { $$('.reveal:not(.in),.t-reveal:not(.in)').forEach(e => { if (e.getBoundingClientRect().top < innerHeight * 1.2) e.classList.add('in'); }); }, 4000);

if (!touch) return;

/* ---------- menu: lock page scroll while the fullscreen menu is open ---------- */
const nav = $('#nav');
if (nav && 'MutationObserver' in window) {
  new MutationObserver(() => root.classList.toggle('menu-lock', nav.classList.contains('menu-open')))
    .observe(nav, { attributes: true, attributeFilter: ['class'] });
}

/* ---------- hero video: iOS wants muted+playsinline set as properties; retry on first touch ---------- */
const vid = $('.hero__video');
if (vid) {
  vid.muted = true; vid.defaultMuted = true; vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', '');
  const tryPlay = () => { const p = vid.play(); if (p && p.catch) p.catch(() => {}); };
  tryPlay();
  addEventListener('touchstart', tryPlay, { once: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tryPlay(); });
}

/* ---------- copy for touch ---------- */
const hint = $('.past .eyebrow');
if (hint) hint.textContent = 'PREVIOUSLY AT SMSC · SWIPE TO EXPLORE';

/* ---------- touch reveal for items that are not .reveal on desktop ---------- */
const tr = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); tr.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
const tAdd = (els, step = 0) => els.forEach((el, i) => {
  el.classList.add('t-reveal'); el.style.setProperty('--d', (i * step) + 's');
  if (tr) tr.observe(el); else el.classList.add('in');
});
tAdd($$('.domain__text'));
tAdd($$('.sponsors h2, .subscribe > *, .footer__top > *'));
tAdd($$('.card'), .08);
tAdd($$('.team-card'), .06);

/* ---------- label chips on domain images (replaces the desktop cursor label) ---------- */
$$('.domain').forEach(d => { const im = $('.domain__img', d); if (im && d.dataset.fig) im.dataset.label = d.dataset.fig; });

/* ---------- scroll-driven effects (parallax, hero fade) ---------- */
const domains = $$('.domain__img'), hero = $('.hero'), heroIn = $('.hero__inner');
let ticking = false;
function frame() {
  ticking = false;
  const vh = innerHeight;
  domains.forEach(box => {
    const r = box.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) return;
    const p = (r.top + r.height / 2 - vh / 2) / vh;           /* -1 … 1 */
    box.firstElementChild.style.setProperty('--py', (-p * 26).toFixed(1) + 'px');
  });
  if (hero && !reduce) {
    const h = hero.offsetHeight, y = Math.min(Math.max(scrollY, 0), h);
    const t = y / h;
    if (heroIn) { heroIn.style.transform = `translate3d(0,${(y * .18).toFixed(1)}px,0)`; heroIn.style.opacity = (1 - t * 1.15).toFixed(3); }
    if (vid) vid.style.setProperty('--hs', (1 + t * .08).toFixed(3));
  }
}
const kick = () => { if (!ticking) { ticking = true; raf(frame); } };
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', kick); addEventListener('orientationchange', kick);
frame();

/* ---------- sliders: swipe + endless wrap + idle auto-drift ---------- */
$$('.slider').forEach(sl => {
  const track = $('.slider__track', sl);
  if (!track) return;
  const orig = [...track.children];
  const speed = (+sl.dataset.speed || 50) * .8;
  let setW = 0, pos = 0, lastSet = -1, touching = false, idleUntil = 0, visible = true, lastW = 0, wrapT;

  /* give every figure an explicit pixel width from the image's aspect ratio */
  const sizeFigures = () => {
    orig.forEach(fig => {
      const im = $('img', fig); if (!im) return;
      if (im.naturalWidth && im.naturalHeight) fig.style.width = Math.round(fig.offsetHeight * im.naturalWidth / im.naturalHeight) + 'px';
    });
  };
  const build = () => {
    sizeFigures();
    [...track.children].slice(orig.length).forEach(n => n.remove());
    const probe = orig.map(n => n.cloneNode(true)); probe.forEach(n => track.appendChild(n));
    setW = probe[0].offsetLeft - orig[0].offsetLeft;
    if (!(setW > 40)) { probe.forEach(n => n.remove()); setW = 0; return; }   /* images not ready yet */
    let sets = 2; while (sets * setW < innerWidth * 3 + setW * 2 && sets < 12) { orig.forEach(n => track.appendChild(n.cloneNode(true))); sets++; }
    if (!lastW) { pos = setW; } else { pos = ((pos % setW) + setW) % setW + setW; }
    lastW = innerWidth; lastSet = pos; sl.scrollLeft = pos;
  };
  let bt; const rebuild = () => { clearTimeout(bt); bt = setTimeout(build, 60); };
  $$('img', track).forEach(im => { if (!im.complete) im.addEventListener('load', rebuild, { once: true }); });
  addEventListener('load', build);
  addEventListener('resize', () => { if (innerWidth !== lastW) rebuild(); });   /* ignore iOS address-bar height changes */
  build();

  const hold = () => { idleUntil = performance.now() + 2800; };
  sl.addEventListener('touchstart', () => { touching = true; pos = sl.scrollLeft; }, { passive: true });
  sl.addEventListener('touchend', () => { touching = false; hold(); }, { passive: true });
  sl.addEventListener('touchcancel', () => { touching = false; hold(); }, { passive: true });
  sl.addEventListener('scroll', () => {
    if (Math.abs(sl.scrollLeft - lastSet) > 1.5) { pos = sl.scrollLeft; hold(); }   /* a user scroll, not ours */
    clearTimeout(wrapT);
    wrapT = setTimeout(() => {               /* when momentum has settled, jump by exactly one set to stay in the middle */
      if (touching || !setW) return;
      if (sl.scrollLeft < setW * .5) { pos = sl.scrollLeft + setW; lastSet = pos; sl.scrollLeft = pos; }
      else if (sl.scrollLeft > setW * 1.5) { pos = sl.scrollLeft - setW; lastSet = pos; sl.scrollLeft = pos; }
    }, 140);
  }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(sl);

  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!reduce && setW && visible && !touching && !document.hidden && now > idleUntil) {
      pos += speed * dt;
      if (pos >= setW * 1.5) pos -= setW;
      sl.scrollLeft = pos; lastSet = sl.scrollLeft;
    }
    raf(loop);
  })(last);
});

/* ---------- dialog: no background scroll on iOS + swipe down to close ---------- */
const md = $('#mdialog');
if (md) {
  const panel = $('.mdialog__panel', md), closeBtn = $('#mdClose');
  document.addEventListener('touchmove', e => { if (!md.hidden && !panel.contains(e.target)) e.preventDefault(); }, { passive: false });
  let y0 = null, dy = 0;
  panel.addEventListener('touchstart', e => { y0 = panel.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
  panel.addEventListener('touchmove', e => { if (y0 !== null) dy = e.touches[0].clientY - y0; }, { passive: true });
  panel.addEventListener('touchend', () => { if (y0 !== null && dy > 110 && closeBtn) closeBtn.click(); y0 = null; dy = 0; }, { passive: true });
}
})();
