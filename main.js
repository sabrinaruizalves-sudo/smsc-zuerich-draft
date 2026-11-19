(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- nav + progress ---------- */
const nav = $('#nav'), fill = $('#progressFill'), burger = $('#burger');
function onScroll() {
  nav.classList.toggle('is-solid', scrollY > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  fill.style.transform = `scaleY(${max > 0 ? scrollY / max : 0})`;
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open); nav.classList.toggle('menu-open', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', false); nav.classList.remove('menu-open'); }));

/* ---------- text scramble ---------- */
const CH = '!<>-_\\/[]{}—=+*^?#01';
function scramble(el, delay = 0) {
  const final = el.dataset.final || (el.dataset.final = el.firstChild.textContent);
  const small = el.querySelector('small');
  const target = final.trim();
  if (reduce) return;
  const len = target.length, start = performance.now() + delay, dur = 1100;
  const node = el.firstChild;
  (function tick(now) {
    const t = Math.max(0, Math.min(1, (now - start) / dur));
    let out = '';
    for (let i = 0; i < len; i++) {
      const c = target[i];
      if (c === ' ') out += ' ';
      else if (i / len < t) out += c;
      else out += CH[(Math.random() * CH.length) | 0];
    }
    node.textContent = t === 0 ? target.replace(/\S/g, '·') : out;
    if (t < 1) requestAnimationFrame(tick); else node.textContent = target;
  })(performance.now());
}
const scrEls = $$('[data-scramble], [data-scramble-delay]');
scrEls.forEach(el => el.dataset.final = el.firstChild.textContent);
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; io.unobserve(e.target);
  const d = +(e.target.dataset.scrambleDelay || 0);
  scramble(e.target, d);
}), { threshold: .4 });
scrEls.forEach(el => io.observe(el));

/* reveal */
const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: .15 });
$$('.reveal').forEach(el => rio.observe(el));

/* ---------- custom cursor over domain images ---------- */
const cur = $('#cursor'), curLabel = $('#cursorLabel');
let cx = 0, cy = 0, tx = 0, ty = 0;
if (matchMedia('(hover:hover)').matches) {
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function loop() { cx += (tx - cx) * .18; cy += (ty - cy) * .18; cur.style.left = cx + 'px'; cur.style.top = cy + 'px'; requestAnimationFrame(loop); })();
  $$('.domain').forEach(d => {
    const img = $('.domain__img', d);
    img.addEventListener('mouseenter', () => { curLabel.textContent = d.dataset.cursor; cur.classList.add('on'); });
    img.addEventListener('mouseleave', () => cur.classList.remove('on'));
  });
}

/* ---------- infinite slider with slow-down on hover ---------- */
$$('.slider').forEach(sl => {
  if (document.documentElement.classList.contains('is-touch')) return;   /* phones/tablets: handled by mobile.js (native swipe) */
  const track = $('.slider__track', sl);
  const base = +sl.dataset.speed || 50, slow = +sl.dataset.hoverSpeed || base;
  const orig = [...track.children];
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  let setW = 0;
  const build = () => {
    [...track.children].slice(orig.length).forEach(n => n.remove());
    setW = orig.reduce((w, n) => w + n.getBoundingClientRect().width + gap, 0);
    let total = setW; while (setW > 0 && total < innerWidth * 2 + setW) { orig.forEach(n => track.appendChild(n.cloneNode(true))); total += setW; }
  };
  const imgs = $$('img', track);
  Promise.all(imgs.map(i => i.decode ? i.decode().catch(() => {}) : 0)).then(build); build();
  addEventListener('resize', build);
  let pos = 0, speed = base, target = base, last = performance.now();
  sl.addEventListener('mouseenter', () => target = slow);
  sl.addEventListener('mouseleave', () => target = base);
  (function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    speed += (target - speed) * Math.min(1, dt * 4);
    if (!reduce && setW) { pos = (pos + speed * dt) % setW; track.style.transform = `translate3d(${-pos}px,0,0)`; }
    requestAnimationFrame(loop);
  })(last);
});

/* ---------- morphing dialog ---------- */
const DATA = {
  talks: { img: 'assets/img/talks1.jpg', kicker: '01 — TALKS', title: 'Talks', text: 'Keynotes and short talks from astronauts, divers, mountain doctors and emergency physicians — across Deep Space, Deep Sea, High Altitude and Emergency Medicine.', list: ['Keynotes', '4 chapters', 'Q&A with speakers'] },
  workshops: { img: 'assets/img/workshops1.jpg', kicker: '02 — WORKSHOPS', title: 'Workshops', text: 'Hands-on sessions in small groups: practise skills used at the limits, from emergency procedures to simulation scenarios.', list: ['Small groups', 'Hands-on skills', 'Sign-up on registration'] },
  fair: { img: 'assets/img/fair1.jpg', kicker: '03 — PROJECT FAIR', title: 'Project Fair', text: 'Meet research groups, student initiatives and organisations. Present your own project, find a thesis topic or your next collaboration.', list: ['Research posters', 'Student initiatives', 'Network with experts'] },
  social: { img: 'assets/img/social1.jpg', kicker: '04 — SOCIAL PROGRAM', title: 'Social Program', text: 'Where the conference continues after hours: dinner, drinks and a party to meet fellow medical students from across Switzerland and beyond.', list: ['Conference dinner', 'Evening party', 'Meet your peers'] }
};
const md = $('#mdialog'), panel = $('.mdialog__panel', md), mdImg = $('#mdImg');
let activeCard = null, anim = null, busy = false, pendingDone = null;
/* preload dialog images so they are cached and never show half-loaded */
Object.values(DATA).forEach(d => { const i = new Image(); i.src = d.img; });
const loadImg = src => new Promise(res => {
  mdImg.onload = mdImg.onerror = () => res();
  mdImg.src = src;
  if (mdImg.complete && mdImg.naturalWidth) res();
});
/* cancel every running/filled animation so a stale "fill: forwards" can never distort the next open */
function stopAnim() { if (anim) { anim.onfinish = null; anim = null; } if (panel.getAnimations) panel.getAnimations().forEach(a => a.cancel()); }
function fill_(d) {
  $('#mdKicker').textContent = d.kicker; $('#mdTitle').textContent = d.title; $('#mdText').textContent = d.text;
  $('#mdList').innerHTML = d.list.map(x => `<li>${x}</li>`).join('');
}
async function openDlg(card) {
  if (busy || activeCard) return; busy = true;
  if (pendingDone) pendingDone();   /* a close animation is still running: finish it first */
  stopAnim();
  const d = DATA[card.dataset.key];
  fill_(d); await loadImg(d.img);   /* image ready BEFORE the panel is measured */
  activeCard = card; busy = false;
  md.hidden = false; document.body.style.overflow = 'hidden';
  const from = card.getBoundingClientRect(), to = panel.getBoundingClientRect();
  const dx = from.left - to.left, dy = from.top - to.top, sx = from.width / to.width, sy = from.height / to.height;
  card.style.visibility = 'hidden';
  if (!reduce && panel.animate) { anim = panel.animate([{ transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, borderRadius: '24px' }, { transform: 'none', borderRadius: '28px' }], { duration: 550, easing: 'cubic-bezier(.2,.8,.2,1)' }); anim.onfinish = stopAnim; }
  requestAnimationFrame(() => md.classList.add('open'));
  $('#mdClose').focus({ preventScroll: true });
}
function closeDlg() {
  if (!activeCard) return; const card = activeCard; activeCard = null;
  md.classList.remove('open');
  stopAnim();
  const from = card.getBoundingClientRect(), to = panel.getBoundingClientRect();
  const done = () => { pendingDone = null; stopAnim(); md.hidden = true; card.style.visibility = ''; document.body.style.overflow = ''; card.focus({ preventScroll: true }); };
  if (reduce || !panel.animate) return done();
  anim = panel.animate([{ transform: 'none' }, { transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})` }], { duration: 420, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' });
  pendingDone = done; anim.onfinish = done;   /* done() cancels the fill so the next open starts clean */
}
$$('.card').forEach(c => c.addEventListener('click', () => openDlg(c)));
$('#mdClose').addEventListener('click', closeDlg);
$('.mdialog__backdrop', md).addEventListener('click', closeDlg);
addEventListener('keydown', e => { if (e.key === 'Escape') closeDlg(); });

/* ---------- subscribe (demo) ---------- */
$('#subForm').addEventListener('submit', e => { e.preventDefault(); $('#subOk').hidden = false; e.target.reset(); });
})();
