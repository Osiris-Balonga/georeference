/** Shell styles only. Scalar owns all typography, geometry and controls inside the reference. */
export const countryListStyles = String.raw`
:root { --scalar-custom-header-height: 64px; }
body { margin: 0; background: #0f0f0f; }
.pilot-header, .pilot-navigation, .pilot-error, .pilot-skip {
  font: 14px/1.5 var(--scalar-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  -webkit-font-smoothing: antialiased; color: #e7e7e7;
}
.pilot-header { height: 64px; padding: 0 24px; display: flex; align-items: center; gap: 28px; background: #0f0f0f; position: sticky; top: 0; z-index: 10; }
.pilot-header a { color: inherit; text-decoration: none; }
.pilot-brand { font-size: 18px; font-weight: 650; letter-spacing: -.02em; }
.pilot-header-label { color: #b4b4b4; font-size: 13px; }
.pilot-header nav { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.pilot-header nav a, .pilot-header button { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; min-height: 40px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: #b4b4b4; font: inherit; cursor: pointer; }
.pilot-header nav a[aria-current] { color: #fff; font-weight: 650; }
.pilot-header nav a:hover, .pilot-header button:hover { background: #242424; }
.pilot-header svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
.pilot-header .pilot-menu { display: none; }
.pilot-layout { display: grid; grid-template-columns: 224px minmax(0, 1fr); }
.pilot-navigation { box-sizing: border-box; padding: 24px 16px; position: sticky; top: 64px; height: calc(100dvh - 64px); overflow: auto; scrollbar-width: thin; }
.pilot-navigation h2 { font: inherit; font-size: 11px; letter-spacing: .07em; font-weight: 700; color: #e7e7e7; margin: 28px 12px 10px; }
.pilot-navigation h2:first-child { margin-top: 0; }
.pilot-navigation a { display: flex; align-items: center; gap: 8px; padding: 10px 12px; min-height: 20px; font-size: 13px; color: #b4b4b4; text-decoration: none; border-radius: 3px; }
.pilot-navigation a:hover { background: #1d1d1d; color: #fff; }
.pilot-navigation .pilot-active { background: #242424; color: #fff; font-weight: 550; }
.pilot-method { font: 10px/1.5 ui-monospace, monospace; font-weight: 650; color: #43c4e9; }
.pilot-navigation .pilot-contract { margin-top: 32px; font-size: 12px; }
.pilot-layout main { min-width: 0; }
.pilot-skip { position: fixed; top: -100px; left: 16px; z-index: 20; padding: 10px; background: #242424; }
.pilot-skip:focus { top: 10px; }
.pilot-header a:focus-visible, .pilot-header button:focus-visible, .pilot-navigation a:focus-visible { outline: 2px solid #43c4e9; outline-offset: 2px; }
.pilot-error { margin: 48px; padding: 20px; background: #242424; }
.pilot-error a { color: inherit; text-underline-offset: 4px; }
.pilot-skeleton { padding: 64px 60px; display: grid; gap: 20px; }
.pilot-skeleton div { height: 16px; max-width: 520px; background: #242424; border-radius: 3px; animation: pilot-pulse 1.2s ease-in-out infinite alternate; }
.pilot-skeleton div:first-child { width: 200px; height: 30px; }
.pilot-skeleton div:last-child { height: 220px; margin-top: 32px; }
.pilot-skeleton[hidden], .pilot-error[hidden] { display: none; }
@keyframes pilot-pulse { to { opacity: .45; } }
body.light-mode { background: #fff; }
.light-mode .pilot-header { background: #fff; color: #1b1b1b; }
.light-mode .pilot-navigation, .light-mode .pilot-navigation h2, .light-mode .pilot-header nav a[aria-current] { color: #1b1b1b; }
.light-mode .pilot-navigation a, .light-mode .pilot-header-label, .light-mode .pilot-header button, .light-mode .pilot-header nav a { color: #555; }
.light-mode .pilot-navigation a:hover, .light-mode .pilot-navigation .pilot-active, .light-mode .pilot-header button:hover, .light-mode .pilot-header nav a:hover { background: #f1f1f1; color: #1b1b1b; }
.light-mode .pilot-skeleton div, .light-mode .pilot-error { background: #f1f1f1; color: #1b1b1b; }
@media (max-width: 760px) {
  .pilot-header { padding: 0 16px; gap: 12px; }
  .pilot-header .pilot-menu { display: inline-flex; }
  .pilot-header-label { display: none; }
  .pilot-layout { display: block; }
  .pilot-navigation { display: none; position: fixed; z-index: 9; top: 64px; left: 0; bottom: 0; width: 260px; background: #0f0f0f; }
  .pilot-navigation[data-open=true] { display: block; }
  .light-mode .pilot-navigation { background: #fff; }
  .pilot-skeleton { padding: 32px 24px; }
}
@media (prefers-reduced-motion: reduce) { .pilot-skeleton div { animation: none; } }
`;

export const countryListClient = String.raw`
const menu = document.querySelector('.pilot-menu');
const navigation = document.querySelector('.pilot-navigation');
menu.addEventListener('click', () => {
  const open = navigation.dataset.open !== 'true';
  navigation.dataset.open = String(open); menu.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.dataset.open === 'true') {
    navigation.dataset.open = 'false'; menu.setAttribute('aria-expanded', 'false'); menu.focus();
  }
});
const theme = document.querySelector('.pilot-theme');
let light = false;
try { light = localStorage.getItem('georeference-theme') === 'light'; } catch {}
let reference, options;
function syncTheme() {
  document.body.classList.toggle('light-mode', light);
  document.body.classList.toggle('dark-mode', !light);
  theme.setAttribute('aria-pressed', String(light));
}
syncTheme();
theme.addEventListener('click', () => {
  light = !light; syncTheme();
  try { localStorage.setItem('georeference-theme', light ? 'light' : 'dark'); } catch {}
  reference?.updateConfiguration({...options, forceDarkModeState: light ? 'light' : 'dark'});
});
const skeleton = document.querySelector('.pilot-skeleton');
const error = document.querySelector('.pilot-error');
async function mount() {
  try {
    options = JSON.parse(document.getElementById('country-config').textContent);
    const response = await fetch(options.url);
    if (!response.ok) throw new Error('OpenAPI ' + response.status);
    options.content = await response.json(); delete options.url;
    if (!location.hash) {
      const tag = options.localization.locale === 'fr' ? 'pays' : 'countries';
      history.replaceState(null, '', location.pathname + '#tag/' + tag + '/GET/v1/countries');
    }
    options.forceDarkModeState = light ? 'light' : 'dark';
    options.onLoaded = () => { skeleton.hidden = true; };
    reference = window.Scalar.createApiReference('#country-reference', options);
  } catch { skeleton.hidden = true; error.hidden = false; }
}
mount();
`;
