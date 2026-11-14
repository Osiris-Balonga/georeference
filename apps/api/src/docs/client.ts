export const docsClient = String.raw`
const root = document.documentElement;
let apiReference;
let apiOptions;
const themeButton = document.querySelector('[data-theme-toggle]');
let savedTheme;
try { savedTheme = localStorage.getItem('georeference-theme'); } catch {}
if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
function syncTheme() {
  const light = root.dataset.theme === 'light';
  document.body.classList.toggle('light-mode', light);
  document.body.classList.toggle('dark-mode', !light);
  themeButton?.setAttribute('aria-pressed', String(light));
}
syncTheme();
themeButton?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('georeference-theme', root.dataset.theme); } catch {}
  syncTheme();
  if (apiReference) apiReference.updateConfiguration({...apiOptions, forceDarkModeState: root.dataset.theme});
});
const menu = document.querySelector('[data-menu]');
const sidebar = document.querySelector('.sidebar');
menu?.addEventListener('click', () => {
  const open = sidebar.dataset.open !== 'true';
  sidebar.dataset.open = String(open);
  menu.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && sidebar.dataset.open === 'true') {
    sidebar.dataset.open = 'false'; menu?.setAttribute('aria-expanded','false'); menu?.focus();
  }
});
const filter = document.querySelector('[data-page-filter]');
filter?.addEventListener('input', () => {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const query = normalize(filter.value.trim());
  let matches = 0;
  document.querySelectorAll('[data-page-link]').forEach(link => {
    link.hidden = !normalize(link.textContent).includes(query);
    if (!link.hidden) matches++;
  });
  document.querySelectorAll('.nav-group').forEach(group => {
    group.hidden = ![...group.querySelectorAll('[data-page-link]')].some(link => !link.hidden);
  });
  document.querySelector('[data-no-results]').hidden = matches > 0;
});
const links = [...document.querySelectorAll('.toc a[href^="#"]')];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    links.forEach(link => link.setAttribute('aria-current', String(link.hash === '#' + entry.target.id)));
  }
}, {rootMargin:'-90px 0px -55% 0px'});
document.querySelectorAll('article > section[id]').forEach(section => observer.observe(section));
const config = document.getElementById('scalar-config');
if (config) {
  const loading = document.querySelector('.api-loading');
  const error = document.querySelector('.api-error');
  const fail = () => { loading.hidden = true; error.hidden = false; };
  async function mount() {
    try {
      const options = JSON.parse(config.textContent);
      const response = await fetch(options.url);
      if (!response.ok) throw new Error('OpenAPI ' + response.status);
      options.content = await response.json();
      delete options.url;
      apiOptions = {...options, forceDarkModeState: root.dataset.theme, onLoaded: () => { loading.hidden = true; }};
      apiReference = window.Scalar.createApiReference('#scalar-reference', apiOptions);
    } catch { fail(); }
  }
  if (window.Scalar) mount(); else fail();
}
`;
