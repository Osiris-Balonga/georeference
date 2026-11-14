import { queryResources, type GeographicCatalog } from 'georeference';
import { chapterSpecification } from './specification.ts';
import type { Locale } from './content.ts';

/** Pilot projection: exactly one operation; examples come from the deployed catalog. */
export function countryListSpecification(document: unknown, locale: Locale, catalog: GeographicCatalog): ReturnType<typeof chapterSpecification> {
  const spec = chapterSpecification(document, locale, 'countries');
  const operation = spec.paths['/v1/countries']!.get!;
  spec.paths = { '/v1/countries': { get: operation } };
  spec.info.title = locale === 'fr' ? 'Lister les pays' : 'List countries';
  spec.info.description = locale === 'fr'
    ? 'Retrouvez la République du Congo (CG / COG) et son identifiant stable.'
    : 'Retrieve the Republic of the Congo (CG / COG) and its stable identifier.';
  operation.description = locale === 'fr'
    ? 'Retourne les pays couverts par le référentiel. Le périmètre actuel est la République du Congo. Utilisez l’UUID retourné pour retrouver ses départements.'
    : 'Returns the countries covered by the reference. The current scope is the Republic of the Congo. Use its UUID to retrieve its departments.';
  const result = queryResources(catalog, 'countries', {});
  const success = operation.responses!['200'] as { content: Record<string, { example?: unknown }> };
  success.content['application/json']!.example = {
    data: [...result.data], meta: { datasetVersion: catalog.metadata.datasetVersion,
      coverageStatus: catalog.coverage.status, total: result.total, limit: result.limit, offset: result.offset },
  };
  return spec;
}

export function renderCountryList(locale: Locale, nonce: string): string {
  const fr = locale === 'fr';
  const title = fr ? 'Lister les pays' : 'List countries';
  const path = `/docs/${locale}/countries/list`;
  const config = {
    url: `${path}/openapi.json`, layout: 'modern', theme: 'default', showSidebar: false,
    hideModels: true, hideSearch: true, hideClientButton: true, hideDarkModeToggle: true,
    withDefaultFonts: false, telemetry: false, agent: { disabled: true }, proxyUrl: '',
    showDeveloperTools: 'never', urlRouting: true, localization: { locale },
    documentDownloadType: 'none', defaultOpenAllTags: true,
    defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
    featuredClients: ['shell/curl', 'js/fetch', 'python/requests'],
  };
  const link = (slug: string, label: string) => `<a href="/docs/${locale}/${slug}">${label}</a>`;
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta property="csp-nonce" content="${nonce}"><title>${title} · GeoReference</title><link rel="stylesheet" href="/docs/assets/country-list.css"></head><body class="dark-mode">
<a class="pilot-skip" href="#country-main">${fr ? 'Aller au contenu' : 'Skip to content'}</a>
<header class="pilot-header"><button class="pilot-menu" aria-controls="pilot-navigation" aria-expanded="false" aria-label="${fr ? 'Navigation' : 'Navigation'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><a class="pilot-brand" href="/docs/${locale}/introduction">GeoReference</a><span class="pilot-header-label">${fr ? 'Référence API' : 'API reference'}</span><nav aria-label="${fr ? 'Langue et thème' : 'Language and theme'}"><a href="/docs/fr/countries/list" lang="fr"${fr ? ' aria-current="page"' : ''}>FR</a><a href="/docs/en/countries/list" lang="en"${!fr ? ' aria-current="page"' : ''}>EN</a><button class="pilot-theme" aria-label="${fr ? 'Thème clair' : 'Light theme'}" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg></button></nav></header>
<div class="pilot-layout"><nav id="pilot-navigation" class="pilot-navigation" aria-label="${fr ? 'Documentation' : 'Documentation'}"><h2>${fr ? 'GUIDES' : 'GUIDES'}</h2>${link('quickstart', fr ? 'Premier appel' : 'Quickstart')}${link('model', fr ? 'Lieux et relations' : 'Places and relationships')}<h2>${fr ? 'PAYS' : 'COUNTRIES'}</h2><a class="pilot-active" href="${path}" aria-current="page"><span class="pilot-method">GET</span>${title}</a>${link('countries', fr ? 'Toutes les opérations' : 'All operations')}<h2>${fr ? 'RESSOURCES' : 'RESOURCES'}</h2>${link('departments', fr ? 'Départements' : 'Departments')}${link('communes', fr ? 'Communes' : 'Communes')}${link('arrondissements', fr ? 'Arrondissements' : 'Arrondissements')}${link('neighborhoods', fr ? 'Quartiers' : 'Neighborhoods')}${link('villages', fr ? 'Villages' : 'Villages')}<a class="pilot-contract" href="${path}/openapi.json">OpenAPI JSON</a></nav>
<main id="country-main" tabindex="-1"><div class="pilot-skeleton" role="status" aria-label="${fr ? 'Chargement de la référence' : 'Loading reference'}"><div></div><div></div><div></div><div></div></div><div id="country-reference"></div><p class="pilot-error" role="alert" hidden>${fr ? 'La référence ne peut pas être chargée.' : 'The reference could not be loaded.'} <a href="${path}">${fr ? 'Réessayer' : 'Try again'}</a></p><noscript><p>${fr ? 'Activez JavaScript pour la référence interactive ou consultez le' : 'Enable JavaScript for the interactive reference or read the'} <a href="${path}/openapi.json">JSON OpenAPI</a>.</p></noscript></main></div>
<script id="country-config" type="application/json" nonce="${nonce}">${JSON.stringify(config)}</script><script src="/docs/js/scalar.js" nonce="${nonce}" defer></script><script src="/docs/assets/country-list.js" nonce="${nonce}" defer></script></body></html>`;
}
