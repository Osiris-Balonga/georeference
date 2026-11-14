import type { Locale } from './content.ts';
import { operationAddress, type ReferenceOperation } from './operations.ts';
import { renderShell } from './shell.ts';

export function renderReference(locale: Locale, operation: ReferenceOperation, operations: ReferenceOperation[], nonce: string): string {
  const fr = locale === 'fr';
  const path = operationAddress(locale, operation);
  const config = {
    url: `${path}/openapi.json`, layout: 'modern', theme: 'default', showSidebar: false,
    hideModels: true, hideSearch: true, hideClientButton: true, hideDarkModeToggle: true,
    withDefaultFonts: false, telemetry: false, agent: { disabled: true }, proxyUrl: '',
    showDeveloperTools: 'never', urlRouting: false, localization: { locale },
    documentDownloadType: 'none', defaultOpenAllTags: true,
    defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
    featuredClients: ['shell/curl', 'js/fetch', 'python/requests'],
  };
  const content = `<div class="docs-skeleton" role="status" aria-label="${fr ? 'Chargement de la référence' : 'Loading reference'}"><div></div><div></div><div></div><div></div></div><div id="operation-reference"></div><p class="docs-error" role="alert" hidden>${fr ? 'La référence ne peut pas être chargée.' : 'The reference could not be loaded.'} <a href="${path}">${fr ? 'Réessayer' : 'Try again'}</a></p><noscript><p>${fr ? 'Activez JavaScript pour la référence interactive ou consultez le' : 'Enable JavaScript for the interactive reference or read the'} <a href="${path}/openapi.json">JSON OpenAPI</a>.</p></noscript>`;
  return renderShell(locale, {title: operation.title, slug: `${operation.group}/${operation.slug}`, content, scalarConfig: config}, operations, nonce);
}
