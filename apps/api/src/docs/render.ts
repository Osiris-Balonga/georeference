import { chapters, type Chapter, type Locale } from './content.ts';

const icon = (path: string) => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
const brandIcon = icon('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z M4 7.5l8 4.5 8-4.5 M12 12v9"/>');
export function renderChapter(locale: Locale, chapter: Chapter, nonce: string): string {
  const fr = locale === 'fr';
  const all = chapters(locale);
  const index = all.findIndex(row => row.slug === chapter.slug);
  const href = (slug: string) => `/docs/${locale}/${slug}`;
  const toc = chapter.sections.map((s, i) => `<a href="#${s.id}"${i === 0 ? ' aria-current="true"' : ''}>${s.title}</a>`).join('');
  const group = (title: string, items: Chapter[]) => `<div class="nav-group"><h2>${title}</h2>${items.map(item => `<a data-page-link href="${href(item.slug)}"${item.slug === chapter.slug ? ' aria-current="page"' : ''}>${item.title}</a>`).join('')}</div>`;
  const direction = (item: Chapter | undefined, label: string) => item ? `<a href="${href(item.slug)}"><span>${label}</span>${item.title}</a>` : '';
  const config = {
    url: `/docs/${locale}/spec/${chapter.slug}.json`, layout: 'classic', showSidebar: false,
    hideModels: true, hideClientButton: true, hideDarkModeToggle: true,
    withDefaultFonts: false, telemetry: false, agent: { disabled: true }, proxyUrl: '',
    showDeveloperTools: 'never', urlRouting: false, localization: { locale }, theme: 'none',
  };
  const api = `<p class="api-loading" role="status">${fr ? 'Chargement des opérations…' : 'Loading operations…'}</p><div id="scalar-reference"></div>
    <p class="api-error" role="alert" hidden>${fr ? 'La référence ne peut pas être chargée.' : 'The reference could not be loaded.'} <a href="${href(chapter.slug)}">${fr ? 'Réessayer' : 'Try again'}</a></p>`;
  return `<!doctype html><html lang="${locale}" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta property="csp-nonce" content="${nonce}"><title>${chapter.title} · GeoReference</title><meta name="description" content="${chapter.description}"><link rel="stylesheet" href="/docs/assets/docs.css"><link rel="alternate" hreflang="${fr ? 'en' : 'fr'}" href="/docs/${fr ? 'en' : 'fr'}/${chapter.slug}"></head><body>
  <a class="skip" href="#content">${fr ? 'Aller au contenu' : 'Skip to content'}</a>
  <header class="topbar"><div class="top-inner"><button class="icon-button menu-button" data-menu aria-label="${fr ? 'Ouvrir la navigation' : 'Open navigation'}" aria-expanded="false" aria-controls="docs-sidebar">${icon('<path d="M4 6h16M4 12h16M4 18h16"/>')}</button><a class="brand" href="${href('introduction')}">${brandIcon}GeoReference</a><span class="top-label">Documentation</span><div class="top-actions"><a href="/docs/fr/${chapter.slug}" lang="fr" ${fr ? 'aria-current="true"' : ''}>FR</a><a href="/docs/en/${chapter.slug}" lang="en" ${!fr ? 'aria-current="true"' : ''}>EN</a><button class="icon-button" data-theme-toggle aria-label="${fr ? 'Thème clair' : 'Light theme'}" aria-pressed="false">${icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>')}</button><a class="github-link" href="https://github.com/Osiris-Balonga/georeference">GitHub ${icon('<path d="M7 17 17 7M7 7h10v10"/>')}</a></div></div></header>
  <div class="layout"><nav class="sidebar" id="docs-sidebar" aria-label="${fr ? 'Chapitres' : 'Chapters'}"><input class="page-filter" data-page-filter type="search" aria-label="${fr ? 'Trouver une page' : 'Find a page'}" placeholder="${fr ? 'Trouver une page…' : 'Find a page…'}">${group(fr ? 'Bien démarrer' : 'Get started', all.slice(0, 4))}${group(fr ? 'Référence API' : 'API reference', all.slice(4, 13))}${group(fr ? 'Service' : 'Service', all.slice(13))}<p class="no-results" data-no-results role="status" hidden>${fr ? 'Aucune page trouvée.' : 'No pages found.'}</p></nav>
  <main id="content" tabindex="-1"><article class="article"><details class="mobile-toc"><summary>${fr ? 'Sur cette page' : 'On this page'}</summary>${toc}</details><header><h1>${chapter.title}</h1><p class="lead">${chapter.description}</p></header>${chapter.sections.map(s => `<section id="${s.id}" aria-labelledby="${s.id}-heading"><h2 id="${s.id}-heading">${s.title}</h2>${s.html}${s.id === 'operations' ? api : ''}</section>`).join('')}<nav class="chapter-nav" aria-label="${fr ? 'Pages précédente et suivante' : 'Previous and next pages'}">${direction(all[index - 1], fr ? 'Précédent' : 'Previous')}${direction(all[index + 1], fr ? 'Suivant' : 'Next')}</nav><p class="footer-note">${fr ? 'République du Congo · CG / COG · Couverture partielle' : 'Republic of the Congo · CG / COG · Partial coverage'}</p></article></main>
  <aside class="toc" aria-label="${fr ? 'Sommaire de cette page' : 'Page contents'}"><h2>${fr ? 'Sur cette page' : 'On this page'}</h2>${toc}<a class="spec-link" href="/openapi.json">${icon('<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>')}OpenAPI JSON</a></aside></div>
  ${chapter.api ? `<script id="scalar-config" type="application/json" nonce="${nonce}">${JSON.stringify(config).replaceAll('<', '\\u003c')}</script><script src="/docs/js/scalar.js" nonce="${nonce}" defer></script>` : ''}<script src="/docs/assets/client.js" nonce="${nonce}" defer></script></body></html>`;
}
