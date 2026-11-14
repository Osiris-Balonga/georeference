/** An explicit language selection wins; otherwise use the browser's primary language. */
export function preferredLocale(language = '', cookie = ''): 'fr' | 'en' {
  const saved = cookie.match(/(?:^|;\s*)242places-locale=(fr|en)(?:;|$)/)?.[1];
  if (saved === 'fr' || saved === 'en') return saved;
  const primary = language.split(',').map((part, order) => {
    const [tag = '', weight] = part.trim().split(';');
    const quality = weight === undefined ? 1 : /^q=(0(?:\.\d{1,3})?|1(?:\.0{1,3})?)$/.test(weight.trim()) ? Number(weight.trim().slice(2)) : 0;
    return { tag, quality, order };
  }).filter(item => item.quality > 0).sort((a, b) => b.quality - a.quality || a.order - b.order)[0]?.tag;
  return /^fr(?:-|$)/i.test(primary ?? '') ? 'fr' : 'en';
}

/** Runs in the head before styles to avoid a dark flash on a light system. */
export const preferenceBootstrap = String.raw`
(() => {
  let theme;
  try { theme = localStorage.getItem('242places-theme'); } catch {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = 'dark';
    try { if (window.matchMedia('(prefers-color-scheme: light)').matches) theme = 'light'; } catch {}
  }
  document.documentElement.dataset.theme = theme;
})();`;
