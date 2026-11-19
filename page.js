/* Shared behaviour for sub-pages: nav, progress bar, text scramble, scroll reveal. (Same effects as the home page.) */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const nav = $('#nav'), fill = $('#progressFill'), burger = $('#burger');
function onScroll() {
  nav.classList.toggle('is-solid', scrollY > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  fill.style.transform = `scaleY(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open); nav.classList.toggle('menu-open', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', false); nav.classList.remove('menu-open'); }));

/* text scramble */
const CH = '!<>-_\\/[]{}—=+*^?#01';
function scramble(el, delay = 0) {
  const target = el.dataset.final.trim();
  if (reduce) return;
  const len = target.length, start = performance.now() + delay, dur = 1100, node = el.firstChild;
  (function tick(now) {
    const t = Math.max(0, Math.min(1, (now - start) / dur));
    let out = '';
    for (let i = 0; i < len; i++) { const c = target[i]; out += c === ' ' ? ' ' : (i / len < t ? c : CH[(Math.random() * CH.length) | 0]); }
    node.textContent = t === 0 ? target.replace(/\S/g, '·') : out;
    if (t < 1) requestAnimationFrame(tick); else node.textContent = target;
  })(performance.now());
}
const scrEls = $$('[data-scramble]');
scrEls.forEach(el => el.dataset.final = el.firstChild.textContent);
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target); scramble(e.target, +(e.target.dataset.scrambleDelay || 0));
  }), { threshold: .4 });
  scrEls.forEach(el => io.observe(el));
}

/* reveal */
if ('IntersectionObserver' in window) {
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: .15 });
  window.__reveal = el => { el.classList.add('reveal'); rio.observe(el); };
  $$('.reveal').forEach(el => rio.observe(el));
} else { window.__reveal = el => el.classList.add('in'); $$('.reveal').forEach(el => el.classList.add('in')); }
})();
