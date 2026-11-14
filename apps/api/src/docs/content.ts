import { productChapters } from './product.ts';
export type Locale = 'fr' | 'en';
export interface Section { id: string; title: string; html: string }
export interface Chapter { slug: string; title: string; description: string; sections: Section[]; api?: boolean }
export const resources = [
  ['congo', 'République du Congo', 'Republic of the Congo'], ['discovery', 'Lieux du Congo', 'Congo places'],
  ['countries', 'Pays', 'Countries'], ['departments', 'Départements', 'Departments'],
  ['communes', 'Communes', 'Communes'], ['districts', 'Districts', 'Districts'],
  ['arrondissements', 'Arrondissements', 'Arrondissements'],
  ['urban-communities', 'Communautés urbaines', 'Urban communities'],
  ['rural-communities', 'Communautés rurales', 'Rural communities'],
  ['neighborhoods', 'Quartiers', 'Neighborhoods'], ['villages', 'Villages', 'Villages'],
  ['reference', 'Données et couverture', 'Dataset and coverage'], ['health', 'État du service', 'Service health'],
] as const;

const section = (id: string, title: string, html: string): Section => ({ id, title, html });
const usage: Record<string, [string, string]> = {
  congo: ['Point d’entrée du référentiel Congo-Brazzaville (CG / COG). Utilisez les collections de départements et la recherche de lieux sans sélectionner un autre pays.', 'Entry point for the Congo-Brazzaville reference (CG / COG). Use the departments and place search without selecting another country.'],
  discovery: ['Recherchez par nom, catégorie ou territoire parent. Chaque résultat conserve son type et ses ancêtres ; les limites géographiques ne sont pas disponibles.', 'Search by name, category or parent territory. Each result retains its type and ancestors; geographic boundaries are unavailable.'],
  countries: ['Le référentiel couvre un pays : la République du Congo, identifiée par les codes CG et COG. Retrouvez ses départements à partir de son UUID.', 'The reference covers one country: the Republic of the Congo, identified by CG and COG. Retrieve its departments using its UUID.'],
  departments: ['Les départements sont rattachés au pays. Un département et une commune homonymes restent deux lieux distincts ; utilisez la catégorie adaptée à votre formulaire.', 'Departments belong to the country. A department and a commune sharing a name are distinct places; choose the category your form needs.'],
  communes: ['Pour le champ « ville » de votre formulaire, commencez ici. À partir de l’UUID d’une commune, chargez ses arrondissements ou tous ses quartiers connus.', 'Start here for your form’s city field. Use a commune’s UUID to load its arrondissements or all its known neighborhoods.'],
  districts: ['Les districts sont rattachés à un département. Ils permettent de retrouver les communautés et les villages documentés sur leur territoire.', 'Districts belong to a department. Use them to retrieve documented communities and villages within their territory.'],
  arrondissements: ['Un arrondissement dépend d’une commune. Sélectionnez d’abord la ville, puis son arrondissement, pour retrouver les quartiers qui lui sont rattachés.', 'An arrondissement belongs to a commune. Select the city, then its arrondissement, to retrieve the neighborhoods attached to it.'],
  'urban-communities': ['Les communautés urbaines sont rattachées à un district. Leurs quartiers et villages connus restent associés à cette communauté.', 'Urban communities belong to a district. Their known neighborhoods and villages retain their community relationship.'],
  'rural-communities': ['Les communautés rurales sont rattachées à un district. Consultez les villages et, lorsque les sources en documentent, les quartiers de la communauté.', 'Rural communities belong to a district. Retrieve their villages and, where documented by sources, their neighborhoods.'],
  neighborhoods: ['Un quartier garde son parent documenté : commune, arrondissement ou communauté. Utilisez une route de relation pour retrouver les quartiers d’une ville entière.', 'A neighborhood retains its documented parent: a commune, arrondissement or community. Use a relationship route to retrieve neighborhoods across a whole city.'],
  villages: ['Les villages peuvent dépendre directement d’un district ou d’une communauté. La route des villages d’un district inclut ses descendants documentés.', 'Villages can belong directly to a district or a community. A district’s village route includes its documented descendants.'],
  reference: ['Consultez la version déployée, les sources et les nombres connus par catégorie. Ces nombres décrivent la couverture du référentiel, pas un inventaire national certifié complet.', 'Read the deployed version, sources and known counts by category. These counts describe reference coverage, not a certified complete national inventory.'],
  health: ['Ces deux sondes servent à surveiller le serveur. La première vérifie que le processus répond ; la seconde indique qu’il est prêt à traiter les requêtes.', 'These two probes monitor the server. One checks that the process is alive; the other reports whether it is ready to handle requests.'],
};
export function chapters(locale: Locale): Chapter[] {
  const fr = locale === 'fr';
  const link = (slug: string, text: string) => `<a href="/docs/${locale}/${slug}">${text}</a>`;
  return [
    { slug: 'introduction', title: 'Introduction', description: fr
      ? 'Les villes et lieux du Congo, prêts à rejoindre votre application.'
      : 'Congo’s cities and places, ready for your application.', sections: [
      section('overview', fr ? 'Un référentiel, trois façons de l’utiliser' : 'One reference, three ways to use it', fr
        ? '<p>242Places fournit les données géographiques de la République du Congo : départements, communes, arrondissements, quartiers et villages. Choisissez le mode d’intégration qui correspond à votre projet.</p><dl class="ways"><div><dt>API HTTP</dt><dd>Interrogez les lieux à la demande, sans héberger le référentiel dans votre application.</dd></div><div><dt>Fichiers autonomes</dt><dd>Générez du JSON, CSV, Excel ou SQL avec la CLI. Aucune dépendance permanente dans votre projet.</dd></div><div><dt>SDK optionnel</dt><dd>Consultez le référentiel localement depuis votre code JavaScript ou TypeScript.</dd></div></dl>'
        : '<p>242Places provides geographic data for the Republic of the Congo: departments, communes, arrondissements, neighborhoods and villages. Choose the integration that fits your project.</p><dl class="ways"><div><dt>HTTP API</dt><dd>Query places on demand without hosting the reference in your application.</dd></div><div><dt>Standalone files</dt><dd>Generate JSON, CSV, Excel or SQL with the CLI. No permanent project dependency.</dd></div><div><dt>Optional SDK</dt><dd>Query the reference locally from JavaScript or TypeScript.</dd></div></dl>'),
      section('choose', fr ? 'Choisir votre intégration' : 'Choose your integration', `<p>${link('cli', fr ? 'Générer des fichiers avec le CLI' : 'Generate files with the CLI')} · ${link('exports', 'JSON / CSV / Excel')} · ${link('sql', 'SQL / SQLite')} · ${link('seeding', fr ? 'Importer en base' : 'Import into a database')} · ${link('sdk', fr ? 'Utiliser le SDK' : 'Use the SDK')}</p>`),
      section('start', fr ? 'Commencer par une ville' : 'Start with a city', fr
        ? `<p>Pour alimenter un formulaire, commencez par les communes. Récupérez ensuite les arrondissements de la ville choisie, puis ses quartiers.</p><pre><code>GET /v1/communes?q=Brazzaville</code></pre><p>${link('quickstart', 'Suivre le premier appel')} ou ${link('communes', 'consulter la référence des communes')}.</p>`
        : `<p>For a location form, start with communes. Then retrieve the selected city’s arrondissements and neighborhoods.</p><pre><code>GET /v1/communes?q=Brazzaville</code></pre><p>${link('quickstart', 'Make your first request')} or ${link('communes', 'browse the commune reference')}.</p>`),
      section('coverage', fr ? 'Ce que les données couvrent' : 'What the data covers', fr
        ? `<p>Le périmètre est la République du Congo (CG / COG), et non la République démocratique du Congo. La couverture reste partielle : une liste vide ne prouve pas l’absence d’un lieu. Les identifiants sont des UUID stables, partagés par l’API et les exports.</p><p>${link('reference', 'Vérifier la version et la couverture')} avant d’exploiter les données.</p>`
        : `<p>The scope is the Republic of the Congo (CG / COG), not the Democratic Republic of the Congo. Coverage remains partial: an empty list does not prove a place is absent. Stable UUIDs are shared by the API and file exports.</p><p>${link('reference', 'Check the dataset version and coverage')} before using the data.</p>`),
    ] },
    ...productChapters(locale),
    { slug: 'quickstart', title: fr ? 'Premier appel' : 'Quickstart', description: fr
      ? 'De Brazzaville à ses quartiers, en quelques requêtes.' : 'From Brazzaville to its neighborhoods in a few requests.', sections: [
      section('request', fr ? 'Votre première requête' : 'Your first request', fr
        ? '<p>L’API est publique et en lecture seule. Aucun jeton n’est nécessaire. Utilisez l’origine du serveur que vous consultez.</p>'
        : '<p>The API is public and read-only. No token is required. Use the origin of the server you are viewing.</p>'),
      section('example', fr ? 'Chercher Brazzaville' : 'Find Brazzaville', `<pre><code>const origin = window.location.origin;
const response = await fetch(origin + '/v1/communes?q=Brazzaville');
if (!response.ok) throw new Error('HTTP ' + response.status);
const { data } = await response.json();
const city = data.find(place =&gt; place.name === 'Brazzaville');</code></pre><p>${fr ? 'Affichez' : 'Display'} <code>name</code> ${fr ? 'dans la liste et conservez' : 'in the select and store'} <code>id</code> ${fr ? 'comme valeur.' : 'as its value.'}</p>`),
      section('cascade', fr ? 'Charger les listes suivantes' : 'Load the next selects', `<pre><code>GET /v1/communes/{id}/arrondissements
GET /v1/arrondissements/{id}/neighborhoods
GET /v1/communes/{id}/neighborhoods</code></pre><p>${fr ? 'La dernière route inclut tous les quartiers connus de la commune, même ceux sans arrondissement documenté. Réinitialisez les sélections dépendantes lorsque la ville change.' : 'The last route includes all known neighborhoods in the commune, even those without a documented arrondissement. Reset dependent selections when the city changes.'}</p><p>${link('model', fr ? 'Comprendre les relations' : 'Understand the relationships')}</p>`),
    ] },
    { slug: 'model', title: fr ? 'Lieux et relations' : 'Places and relationships', description: fr
      ? 'Des noms pour les humains, des UUID pour votre application.' : 'Names for people, UUIDs for your application.', sections: [
      section('identities', fr ? 'Identifiants stables' : 'Stable identifiers', fr
        ? '<p>Chaque lieu possède un UUID stable et un nom lisible. Conservez cet UUID dans votre base. Un département et une commune peuvent porter le même nom tout en ayant deux identités distinctes.</p>'
        : '<p>Each place has a stable UUID and a readable name. Store the UUID in your database. A department and a commune may share a name while remaining two distinct identities.</p>'),
      section('parents', fr ? 'Un parent réel' : 'A documented parent', fr
        ? '<p>Les relations suivent les sources. Un quartier peut être rattaché directement à une commune, à un arrondissement ou à une communauté. Les autres champs de parent valent <code>null</code>. Un filtre de parent direct sélectionne cette relation exacte ; une route de relation peut inclure les descendants documentés.</p>'
        : '<p>Relationships follow the sources. A neighborhood may belong directly to a commune, an arrondissement or a community. Other parent fields are <code>null</code>. A direct-parent filter selects that exact relationship; a relationship route can include documented descendants.</p>'),
      section('versions', fr ? 'Version et couverture' : 'Version and coverage', fr
        ? `<p>La réponse contient <code>meta.datasetVersion</code>. Conservez cette version avec les données enregistrées pour savoir quel référentiel vous avez utilisé. Les dates de réception des sources ne remplacent pas une date d’observation inconnue.</p><p>${link('reference', 'Consulter les sources et les nombres connus')}</p>`
        : `<p>Responses include <code>meta.datasetVersion</code>. Store it with saved results to identify which reference you used. A source receipt date does not replace an unknown observation date.</p><p>${link('reference', 'Browse sources and known counts')}</p>`),
    ] },
    { slug: 'requests', title: fr ? 'Requêtes et erreurs' : 'Requests and errors', description: fr
      ? 'Recherche, pagination et réponses prévisibles.' : 'Search, pagination and predictable responses.', sections: [
      section('search', fr ? 'Recherche et pagination' : 'Search and pagination', fr
        ? '<p><code>q</code> recherche une partie du nom sans distinction de casse ni d’accents (100 caractères maximum). <code>limit</code> vaut 50 par défaut, au maximum 100. Augmentez <code>offset</code> jusqu’à atteindre <code>meta.total</code>.</p><pre><code>GET /v1/neighborhoods?q=Mpila&amp;limit=20&amp;offset=0</code></pre>'
        : '<p><code>q</code> matches a name substring regardless of case or accents (up to 100 characters). <code>limit</code> defaults to 50, with a maximum of 100. Increase <code>offset</code> until you reach <code>meta.total</code>.</p><pre><code>GET /v1/neighborhoods?q=Mpila&amp;limit=20&amp;offset=0</code></pre>'),
      section('errors', fr ? 'Comprendre une erreur' : 'Understand an error', `<p>${fr ? 'Les erreurs retournent' : 'Errors return'} <code>{ error: { code, message, requestId } }</code>.</p><dl class="ways"><div><dt>400</dt><dd>${fr ? 'Paramètre inconnu, UUID ou valeur invalide.' : 'Unknown parameter, invalid UUID or value.'}</dd></div><div><dt>404</dt><dd>${fr ? 'Ressource ou parent introuvable. Un parent connu sans enfant retourne 200 et une liste vide.' : 'Resource or parent not found. A known parent without children returns 200 and an empty list.'}</dd></div><div><dt>429</dt><dd>${fr ? 'Trop de requêtes. Attendez le délai indiqué dans Retry-After.' : 'Too many requests. Wait for the delay in Retry-After.'}</dd></div></dl>`),
      section('cache', fr ? 'Cache et limites' : 'Caching and limits', fr
        ? '<p>Les réponses de données réussies sont mises en cache cinq minutes et fournissent un <code>ETag</code>. Envoyez <code>If-None-Match</code> pour revalider ; une réponse <code>304</code> n’a pas de corps. La limite par défaut est de 60 requêtes par minute et par client, configurable par le serveur.</p>'
        : '<p>Successful data responses are cached for five minutes and include an <code>ETag</code>. Send <code>If-None-Match</code> to revalidate; a <code>304</code> response has no body. The default limit is 60 requests per minute per client, configurable by the server.</p>'),
    ] },
    ...resources.map(([slug, french, english]): Chapter => ({ slug, title: fr ? french : english, api: true,
      description: slug === 'health' ? (fr ? 'Vérifier la disponibilité de l’API.' : 'Check API availability.')
        : slug === 'reference' ? (fr ? 'Comprendre le référentiel que vous interrogez.' : 'Understand the reference you are querying.')
          : (fr ? `Explorer les ${french.toLocaleLowerCase('fr')} et leurs relations.` : `Explore ${english.toLowerCase()} and their relationships.`),
      sections: [section('usage', fr ? 'Utilisation' : 'Usage', `<p>${usage[slug]?.[fr ? 0 : 1]}</p>`),
        section('operations', fr ? 'Opérations' : 'Operations', '')],
    })),
  ];
}
