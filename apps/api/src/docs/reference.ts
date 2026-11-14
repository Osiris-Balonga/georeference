import { chapters, resources, type Locale } from './content.ts';
import { operationAddress, type ReferenceOperation } from './operations.ts';

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** The shell owns navigation; Scalar owns every operation component and its appearance. */
export function renderReference(locale: Locale, operation: ReferenceOperation, operations: ReferenceOperation[], nonce: string): string {
  const fr = locale === 'fr';
  const path = operationAddress(locale, operation);
  const config = {
    url: `${path}/openapi.json`, layout: 'modern', theme: 'default', showSidebar: false,
    hideModels: true, hideSearch: true, hideClientButton: true, hideDarkModeToggle: true,
    withDefaultFonts: false, telemetry: false, agent: { disabled: true }, proxyUrl: '',
    showDeveloperTools: 'never', urlRouting: true, localization: { locale },
    documentDownloadType: 'none', defaultOpenAllTags: true,
    defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
    featuredClients: ['shell/curl', 'js/fetch', 'python/requests'],
  };
  const guides = chapters(locale).filter(chapter => !chapter.api).map(chapter => `<a href="/docs/${locale}/${chapter.slug}">${chapter.title}</a>`).join('');
  const navigation = resources.map(([group, french, english]) => {
    const links = operations.filter(item => item.group === group).map(item => {
      const current = item.path === operation.path;
      return `<a data-operation-link href="${operationAddress(locale, item)}"${current ? ' class="reference-active" aria-current="page"' : ''}><span class="reference-method">GET</span><span>${escape(item.navigationLabel)}</span></a>`;
    }).join('');
    return links ? `<section class="reference-group"><h2>${fr ? french : english}</h2>${links}</section>` : '';
  }).join('');
  const other = fr ? 'en' : 'fr';
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta property="csp-nonce" content="${nonce}"><title>${escape(operation.title)} · GeoReference</title><link rel="alternate" hreflang="${other}" href="${operationAddress(other, operation)}"><link rel="stylesheet" href="/docs/assets/reference.css"></head><body class="dark-mode">
<a class="reference-skip" href="#reference-main">${fr ? 'Aller au contenu' : 'Skip to content'}</a>
<header class="reference-header"><button class="reference-menu" aria-controls="reference-navigation" aria-expanded="false" aria-label="Navigation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><a class="reference-brand" href="/docs/${locale}/introduction">GeoReference</a><span class="reference-header-label">${fr ? 'Référence API' : 'API reference'}</span><nav aria-label="${fr ? 'Langue et thème' : 'Language and theme'}"><a href="${operationAddress('fr', operation)}" lang="fr"${fr ? ' aria-current="page"' : ''}>FR</a><a href="${operationAddress('en', operation)}" lang="en"${!fr ? ' aria-current="page"' : ''}>EN</a><button class="reference-theme" aria-label="${fr ? 'Thème clair' : 'Light theme'}" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg></button></nav></header>
<div class="reference-layout"><nav id="reference-navigation" class="reference-navigation" aria-label="Documentation"><section class="reference-group"><h2>Guides</h2>${guides}</section>${navigation}<a class="reference-contract" href="/openapi.json">OpenAPI JSON</a></nav>
<main id="reference-main" tabindex="-1"><div class="reference-skeleton" role="status" aria-label="${fr ? 'Chargement de la référence' : 'Loading reference'}"><div></div><div></div><div></div><div></div></div><div id="operation-reference"></div><p class="reference-error" role="alert" hidden>${fr ? 'La référence ne peut pas être chargée.' : 'The reference could not be loaded.'} <a href="${path}">${fr ? 'Réessayer' : 'Try again'}</a></p><noscript><p>${fr ? 'Activez JavaScript pour la référence interactive ou consultez le' : 'Enable JavaScript for the interactive reference or read the'} <a href="${path}/openapi.json">JSON OpenAPI</a>.</p></noscript></main></div>
<script id="reference-config" type="application/json" nonce="${nonce}">${JSON.stringify(config).replaceAll('<', '\\u003c')}</script><script src="/docs/js/scalar.js" nonce="${nonce}" defer></script><script src="/docs/assets/reference.js" nonce="${nonce}" defer></script></body></html>`;
}
