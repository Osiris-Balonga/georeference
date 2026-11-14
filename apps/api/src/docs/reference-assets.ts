/** Shell styles and client-window geometry. Scalar owns operation and client components. */
export const referenceStyles = String.raw`
:root { --scalar-custom-header-height: 64px; }
body { margin: 0; background: #0f0f0f; }
.reference-header, .reference-navigation, .reference-error, .reference-skip {
  font: 14px/1.5 var(--scalar-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  -webkit-font-smoothing: antialiased; color: #e7e7e7;
}
.reference-header { height: 64px; padding: 0 24px; display: flex; align-items: center; gap: 28px; background: #0f0f0f; position: sticky; top: 0; z-index: 10; }
.reference-header a { color: inherit; text-decoration: none; }
.reference-brand { font-size: 18px; font-weight: 650; letter-spacing: -.02em; }
.reference-header-label { color: #b4b4b4; font-size: 13px; }
.reference-header nav { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.reference-header nav a, .reference-header button { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; min-height: 40px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: #b4b4b4; font: inherit; cursor: pointer; }
.reference-header nav a[aria-current] { color: #fff; font-weight: 650; }
.reference-header nav a:hover, .reference-header button:hover { background: #242424; }
.reference-header svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
.reference-header .reference-menu { display: none; }
.reference-layout { display: grid; grid-template-columns: 224px minmax(0, 1fr); }
.reference-navigation { box-sizing: border-box; padding: 24px 16px; position: sticky; top: 64px; height: calc(100dvh - 64px); overflow: auto; scrollbar-width: thin; }
.reference-navigation h2 { font: inherit; font-size: 11px; letter-spacing: .07em; font-weight: 700; color: #e7e7e7; margin: 0 12px 10px; text-transform: uppercase; }
.reference-group + .reference-group { margin-top: 28px; }
.reference-navigation a { display: flex; align-items: center; gap: 8px; padding: 10px 12px; min-height: 20px; font-size: 13px; color: #b4b4b4; text-decoration: none; border-radius: 3px; }
.reference-navigation a:hover { background: #1d1d1d; color: #fff; }
.reference-navigation .reference-active { background: #242424; color: #fff; font-weight: 550; }
.reference-method { font: 10px/1.5 ui-monospace, monospace; font-weight: 650; color: #43c4e9; flex-shrink: 0; }
.reference-navigation .reference-contract { margin-top: 32px; font-size: 12px; }
.reference-layout main { min-width: 0; }
.reference-skip { position: fixed; top: -100px; left: 16px; z-index: 20; padding: 10px; background: #242424; }
.reference-skip:focus { top: 10px; }
.reference-header a:focus-visible, .reference-header button:focus-visible, .reference-navigation a:focus-visible { outline: 2px solid #43c4e9; outline-offset: 2px; }
.reference-error { margin: 48px; padding: 20px; background: #242424; }
.reference-error a { color: inherit; text-underline-offset: 4px; }
.reference-skeleton { padding: 64px 60px; display: grid; gap: 20px; }
.reference-skeleton div { height: 16px; max-width: 520px; background: #242424; border-radius: 3px; animation: reference-pulse 1.2s ease-in-out infinite alternate; }
.reference-skeleton div:first-child { width: 200px; height: 30px; }
.reference-skeleton div:last-child { height: 220px; margin-top: 32px; }
.reference-skeleton[hidden], .reference-error[hidden] { display: none; }
@keyframes reference-pulse { to { opacity: .45; } }
body.light-mode { background: #fff; }
.light-mode .reference-header { background: #fff; color: #1b1b1b; }
.light-mode .reference-navigation, .light-mode .reference-navigation h2, .light-mode .reference-header nav a[aria-current] { color: #1b1b1b; }
.light-mode .reference-navigation a, .light-mode .reference-header-label, .light-mode .reference-header button, .light-mode .reference-header nav a { color: #555; }
.light-mode .reference-navigation a:hover, .light-mode .reference-navigation .reference-active, .light-mode .reference-header button:hover, .light-mode .reference-header nav a:hover { background: #f1f1f1; color: #1b1b1b; }
.light-mode .reference-skeleton div, .light-mode .reference-error { background: #f1f1f1; color: #1b1b1b; }
/* Pinned Scalar 1.78.1: resize only its modal frame and place its native close control in the toolbar. */
.reference-layout .scalar .scalar-client--open > .scalar-client {
  width: 100%; max-width: none; height: 100dvh; max-height: 100dvh;
  margin: 0; border: 0; border-radius: 0;
}
.reference-layout .scalar-client--open .app-exit-button {
  position: static; inset: auto; min-width: 40px; min-height: 40px;
  border-radius: var(--scalar-radius); color: var(--scalar-color-2); background: transparent;
}
.reference-layout .scalar-client--open .app-exit-button:hover { color: var(--scalar-color-1); background: var(--scalar-background-2); }
@media (max-width: 760px) {
  .reference-header { padding: 0 16px; gap: 12px; }
  .reference-header .reference-menu { display: inline-flex; }
  .reference-header-label { display: none; }
  .reference-layout { display: block; }
  .reference-navigation { display: none; position: fixed; z-index: 9; top: 64px; left: 0; bottom: 0; width: 260px; background: #0f0f0f; }
  .reference-navigation[data-open=true] { display: block; }
  .light-mode .reference-navigation { background: #fff; }
  .reference-skeleton { padding: 32px 24px; }
}
@media (prefers-reduced-motion: reduce) { .reference-skeleton div { animation: none; } }
`;

export const referenceClient = String.raw`
const menu = document.querySelector('.reference-menu');
const navigation = document.querySelector('.reference-navigation');
const active = navigation.querySelector('[aria-current="page"]');
function revealActive() {
  if (active) navigation.scrollTop = Math.max(0, active.offsetTop - navigation.clientHeight / 2);
}
revealActive();
menu.addEventListener('click', () => {
  const open = navigation.dataset.open !== 'true';
  navigation.dataset.open = String(open); menu.setAttribute('aria-expanded', String(open));
  if (open) { revealActive(); active?.focus({preventScroll: true}); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.dataset.open === 'true') {
    navigation.dataset.open = 'false'; menu.setAttribute('aria-expanded', 'false'); menu.focus();
  }
});
const theme = document.querySelector('.reference-theme');
let light = false;
try { light = localStorage.getItem('georeference-theme') === 'light'; } catch {}
let reference, options;
function syncTheme() {
  document.body.classList.toggle('light-mode', light);
  document.body.classList.toggle('dark-mode', !light);
  theme.setAttribute('aria-pressed', String(light));
  const fr = document.documentElement.lang === 'fr';
  theme.setAttribute('aria-label', light ? (fr ? 'Thème sombre' : 'Dark theme') : (fr ? 'Thème clair' : 'Light theme'));
}
syncTheme();
theme.addEventListener('click', () => {
  light = !light; syncTheme();
  try { localStorage.setItem('georeference-theme', light ? 'light' : 'dark'); } catch {}
  reference?.updateConfiguration({...options, forceDarkModeState: light ? 'light' : 'dark'});
});
const skeleton = document.querySelector('.reference-skeleton');
const error = document.querySelector('.reference-error');
async function mount() {
  try {
    options = JSON.parse(document.getElementById('reference-config').textContent);
    const response = await fetch(options.url);
    if (!response.ok) throw new Error('OpenAPI ' + response.status);
    options.content = await response.json(); delete options.url;
    const [path, methods] = Object.entries(options.content.paths)[0];
    const tag = methods.get.tags[0].toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
    const operationFragment = 'tag/' + tag + '/GET' + path;
    if (!location.hash) history.replaceState(null, '', location.pathname + '#' + operationFragment);
    options.forceDarkModeState = light ? 'light' : 'dark';
    let positioned = false;
    options.onLoaded = slug => {
      skeleton.hidden = true;
      if (positioned) return;
      positioned = true;
      requestAnimationFrame(() => {
        let fragment = operationFragment;
        try { fragment = decodeURIComponent(location.hash.slice(1)) || fragment; } catch {}
        const target = document.getElementById(slug + '/' + fragment) ?? document.getElementById(slug + '/' + operationFragment);
        if (target) window.scrollTo({top: scrollY + target.getBoundingClientRect().top - document.querySelector('.reference-header').clientHeight, behavior: 'instant'});
      });
    };
    reference = window.Scalar.createApiReference('#operation-reference', options);
  } catch { skeleton.hidden = true; error.hidden = false; }
}
mount();
`;
