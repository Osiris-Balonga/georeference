export const shellClient = String.raw`
const fr = document.documentElement.lang === 'fr';
const menu = document.querySelector('.docs-menu');
const sidebar = document.querySelector('.docs-sidebar');
const navigation = document.querySelector('.docs-navigation');
const active = navigation.querySelector('[aria-current="page"]');
function revealActive() {
  if (active) navigation.scrollTop = Math.max(0, active.offsetTop - navigation.offsetTop - navigation.clientHeight / 2);
}
revealActive();
menu.addEventListener('click', () => {
  const open = sidebar.dataset.open !== 'true';
  sidebar.dataset.open = String(open); menu.setAttribute('aria-expanded', String(open));
  if (open) { revealActive(); active?.focus({preventScroll: true}); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && sidebar.dataset.open === 'true') {
    sidebar.dataset.open = 'false'; menu.setAttribute('aria-expanded', 'false'); menu.focus();
  }
});
const filter = document.querySelector('[data-page-filter]');
filter.addEventListener('input', () => {
  const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const query = normalize(filter.value.trim());
  let count = 0;
  document.querySelectorAll('.docs-nav-group').forEach(group => {
    const groupMatches = normalize(group.querySelector('h2').textContent).includes(query);
    let matches = 0;
    group.querySelectorAll('[data-page-link]').forEach(link => {
      link.hidden = !groupMatches && !normalize(link.textContent).includes(query);
      if (!link.hidden) matches++;
    });
    group.hidden = matches === 0; count += matches;
  });
  document.querySelector('.docs-no-results').hidden = count > 0;
  navigation.scrollTop = 0;
});
const theme = document.querySelector('.docs-theme');
let light = document.documentElement.dataset.theme === 'light';
let explicitTheme = false;
try { explicitTheme = ['light', 'dark'].includes(localStorage.getItem('242places-theme')); } catch {}
function syncTheme() {
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.body.classList.toggle('light-mode', light);
  document.body.classList.toggle('dark-mode', !light);
  theme.setAttribute('aria-pressed', String(light));
  theme.setAttribute('aria-label', light ? (fr ? 'Thème sombre' : 'Dark theme') : (fr ? 'Thème clair' : 'Light theme'));
}
syncTheme();
theme.addEventListener('click', () => {
  explicitTheme = true;
  light = !light; syncTheme();
  try { localStorage.setItem('242places-theme', light ? 'light' : 'dark'); } catch {}
  window.dispatchEvent(new CustomEvent('docs:theme', {detail: light ? 'light' : 'dark'}));
});
try {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => {
    if (explicitTheme) return;
    light = event.matches; syncTheme();
    window.dispatchEvent(new CustomEvent('docs:theme', {detail: light ? 'light' : 'dark'}));
  });
} catch {}
document.querySelectorAll('[data-locale]').forEach(link => {
  link.addEventListener('click', () => {
    document.cookie = '242places-locale=' + link.dataset.locale + '; Path=/; Max-Age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  });
});
document.querySelectorAll('[data-copy-code]').forEach(button => {
  let timer;
  button.addEventListener('click', async () => {
    const label = button.querySelector('.guide-copy-label');
    const status = document.querySelector('.guide-copy-status');
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(button.closest('.guide-code').querySelector('code').textContent);
      button.dataset.copied = 'true'; label.textContent = fr ? 'Copié' : 'Copied';
      status.textContent = fr ? 'Code copié dans le presse-papiers.' : 'Code copied to clipboard.';
    } catch {
      label.textContent = fr ? 'Copie impossible' : 'Copy failed';
      status.textContent = fr ? 'Sélectionnez le code pour le copier manuellement.' : 'Select the code to copy it manually.';
    }
    timer = setTimeout(() => { delete button.dataset.copied; label.textContent = fr ? 'Copier' : 'Copy'; }, 1800);
  });
});
const sections = document.querySelectorAll('.guide-article > section[id]');
if (sections.length) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      document.querySelectorAll('[data-guide-toc] a').forEach(link => {
        link.setAttribute('aria-current', String(link.hash === '#' + entry.target.id));
      });
    }
  }, {rootMargin: '-88px 0px -50% 0px'});
  sections.forEach(section => observer.observe(section));
}
`;
