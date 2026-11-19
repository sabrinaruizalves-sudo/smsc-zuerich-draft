/* Team page: renders the cards and runs the same morphing dialog as the Program page.
   >>> Edit the TEAM list below: name, role, short bio, tags. `img` is optional (defaults to the p1.jpg placeholder). */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEAM = [
  { name: 'Firstname Lastname', role: 'President',           bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 5', 'Overall lead'] },
  { name: 'Firstname Lastname', role: 'Vice President',      bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 4', 'Coordination'] },
  { name: 'Firstname Lastname', role: 'Program',             bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 4', 'Talks & Workshops'] },
  { name: 'Firstname Lastname', role: 'Speakers',            bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 3', 'Speaker relations'] },
  { name: 'Firstname Lastname', role: 'Workshops',           bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 5', 'Hands-on sessions'] },
  { name: 'Firstname Lastname', role: 'Project Fair',        bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 3', 'Posters & research'] },
  { name: 'Firstname Lastname', role: 'Social Program',      bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 4', 'Dinner & party'] },
  { name: 'Firstname Lastname', role: 'Sponsoring',          bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 5', 'Partners'] },
  { name: 'Firstname Lastname', role: 'Finance',             bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 4', 'Budget'] },
  { name: 'Firstname Lastname', role: 'Communication',       bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 3', 'Social media'] },
  { name: 'xys', role: 'Marketing',        bio: 'I am responsible for shaping the organisation’s visual identity and digital presence. From developing our corporate identity and social media strategy to designing and coding our website, I enjoy bringing creative ideas to life and making sure our work has a consistent voice and look. I also manage our Instagram account and coordinate with other faculties to strengthen collaboration and communication across the organisation. \n\ Outside of medicine and marketing, I enjoy music, particularly singing opera and metal and playing the violin, as well as graphic design, creative projects and exploring new technologies. I also love travelling and practising martial arts.', tags: ['Medicine, Year 2', 'Marketing Strategy'], img: 'assets/img/test.jpg'
  { name: 'Firstname Lastname', role: 'Logistics',           bio: 'Short introduction: studies, what drives this person and what they are responsible for at SMSC Zürich 2027.', tags: ['Medicine, Year 3', 'Venue & volunteers'] },
];
/* Placeholder portraits: p1.jpg (4 thermal figures). Each card crops in on a different figure so the grid is not 12x the same picture.
   Give a member an `img: 'assets/img/xyz.jpg'` to use a real photo (no crop is applied then). */
const PLACEHOLDER = 'assets/img/p1.jpg';
const FIGURES = [[14, 46], [36, 60], [53, 46], [76, 58]];   /* x%, y% of each person in p1.jpg */
const ZOOMS = [1.6, 1.9, 1.45];
function cropStyle(m, i) {
  if (m.img) return '';
  const [x, y] = FIGURES[i % 4], z = ZOOMS[Math.floor(i / 4) % 3], lim = (z - 1) * 50;
  const c = v => Math.max(-lim, Math.min(lim, v)).toFixed(1);
  return `style="scale:${z};translate:${c((50 - x) * z)}% ${c((50 - y) * z)}%"`;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const imgOf = m => m.img || PLACEHOLDER;
const pad2 = n => String(n + 1).padStart(2, '0');

const grid = $('#teamCards');
grid.innerHTML = TEAM.map((m, i) => `
  <button class="card team-card" data-i="${i}" aria-haspopup="dialog">
    <img src="${esc(imgOf(m))}" alt="" 
      onerror="this.onerror=null; this.src='${PLACEHOLDER}';">
    <span class="card__label"><small class="mono">${esc(m.role)}</small><span>${esc(m.name)}</span></span>
    <span class="card__plus" aria-hidden="true">+</span>
  </button>`).join('');
/* desktop: reveal on scroll (touch devices get the same from mobile.js) */
if (!document.documentElement.classList.contains('is-touch')) $$('.team-card', grid).forEach(c => window.__reveal && window.__reveal(c));

/* ---------- morphing dialog (same logic as the Program page) ---------- */
const md = $('#mdialog'), panel = $('.mdialog__panel', md), mdImg = $('#mdImg');
let activeCard = null, anim = null, busy = false, pendingDone = null;
const loadImg = src => new Promise(res => { mdImg.onload = mdImg.onerror = () => res(); mdImg.src = src; if (mdImg.complete && mdImg.naturalWidth) res(); });
function stopAnim() { if (anim) { anim.onfinish = null; anim = null; } if (panel.getAnimations) panel.getAnimations().forEach(a => a.cancel()); }
function fill_(m, i) {
  $('#mdKicker').textContent = `${pad2(i)} — ${m.role.toUpperCase()}`;
  $('#mdTitle').textContent = m.name; $('#mdText').textContent = m.bio;
  $('#mdList').innerHTML = (m.tags || []).map(x => `<li>${esc(x)}</li>`).join('');
  mdImg.alt = '';
}
async function openDlg(card) {
  if (busy || activeCard) return; busy = true;
  if (pendingDone) pendingDone();
  stopAnim();
  const i = +card.dataset.i, m = TEAM[i];
  fill_(m, i); await loadImg(imgOf(m));
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
  md.classList.remove('open'); stopAnim();
  const from = card.getBoundingClientRect(), to = panel.getBoundingClientRect();
  const done = () => { pendingDone = null; stopAnim(); md.hidden = true; card.style.visibility = ''; document.body.style.overflow = ''; card.focus({ preventScroll: true }); };
  if (reduce || !panel.animate) return done();
  anim = panel.animate([{ transform: 'none' }, { transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})` }], { duration: 420, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' });
  pendingDone = done; anim.onfinish = done;
}
grid.addEventListener('click', e => { const c = e.target.closest('.team-card'); if (c) openDlg(c); });
$('#mdClose').addEventListener('click', closeDlg);
$('.mdialog__backdrop', md).addEventListener('click', closeDlg);
addEventListener('keydown', e => { if (e.key === 'Escape') closeDlg(); });
})();
