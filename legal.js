/* Legal page: DE / FR / IT / EN switcher. All four versions are in the HTML (readable without JS);
   this just shows one at a time. Language is chosen from the URL hash, then saved choice, then the browser language. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LANGS = ['de', 'fr', 'it', 'en'];
const tabs = $$('.langtab'), arts = $$('.lang');
let store = null; try { store = window.localStorage; } catch (e) {}

function pick() {
  const h = location.hash.replace('#', '');
  const m = h.match(/-(de|fr|it|en)$/); if (m) return m[1];
  if (LANGS.includes(h)) return h;
  try { const s = store && store.getItem('smsc-lang'); if (LANGS.includes(s)) return s; } catch (e) {}
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : 'en';
}
function show(lang, save) {
  arts.forEach(a => { a.hidden = a.dataset.lang !== lang; });
  tabs.forEach(t => { const on = t.dataset.lang === lang; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  document.documentElement.lang = lang;
  if (save) { try { store && store.setItem('smsc-lang', lang); } catch (e) {} }
}
/* footer links use #imprint / #disclaimer / #privacy: map them to the active language */
function go() {
  const h = location.hash.replace('#', '');
  const lang = pick(); show(lang, false);
  const base = h.replace(/-(de|fr|it|en)$/, '');
  if (['imprint', 'disclaimer', 'privacy'].includes(base)) {
    const el = document.getElementById(`${base}-${lang}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}
tabs.forEach(t => t.addEventListener('click', () => { show(t.dataset.lang, true); history.replaceState(null, '', '#' + t.dataset.lang); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
$('.langtabs').addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
  n.click(); n.focus();
});
addEventListener('hashchange', go);
go();
})();
