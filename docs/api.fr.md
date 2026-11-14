# API HTTP

[English](api.md) · [Accueil](../README.fr.md) · [Architecture](architecture.fr.md)

Le dépôt contient une API Fastify publique en lecture seule pour les ressources de la République du Congo (CG/COG). Elle se lance depuis le code source. Le paquet publié `georeference@1.1.0` reste le générateur de fichiers autonomes et le SDK local optionnel ; `npx georeference` ne démarre pas ce serveur. Ce guide décrit un fonctionnement local, pas un service public déjà déployé.

## Lancer en local

Utilisez Node.js 24.18.x et npm. Depuis la racine du dépôt :

```sh
npm ci
npm run dev:api
```

L’adresse par défaut est `http://127.0.0.1:3000`. Ouvrez `/docs` pour la documentation interactive ou `/openapi.json` pour le contrat exploitable par des outils. Pour lancer le serveur compilé :

```sh
npm run build:api
npm run start:api
```

`build:api` compile le cœur partagé avant l’API. `npm run build` compile toujours le paquet CLI/SDK. L’API est un workspace npm privé avec ses dépendances HTTP ; elle ne devient pas une dépendance permanente du projet dans lequel vous générez des fichiers.

## Documentation interactive avec Scalar

Ouvrez `http://127.0.0.1:3000/docs` après avoir démarré l’API. Vous arrivez sur l’introduction française `/docs/fr/introduction` ; choisissez **EN** pour `/docs/en/introduction`. Les guides possèdent chacun leur adresse, une navigation précédent/suivant et un filtre par nom de page. Leur sommaire apparaît à droite sur grand écran et se replie au-dessus du contenu sur les écrans plus petits. Le changement de langue conserve la page. Sur mobile, utilisez le bouton de menu. La préférence de thème clair/sombre est conservée localement lorsque le stockage du navigateur est disponible.

Les guides expliquent le premier appel, les relations entre lieux, la pagination et les erreurs. Chaque opération API possède sa propre page avec la disposition moderne et les composants natifs de Scalar : paramètres à gauche, exemples de requête et de réponse à droite lorsque la largeur le permet. La navigation regroupe listes, consultations par UUID et relations par ressource ; elle comprend aussi la version des données, la couverture et l’état du service. Les pages d’opération n’ont pas de colonne de sommaire supplémentaire. Les anciennes URL de catégorie redirigent vers leur première opération.

Sur `/docs/fr/communes/list`, ouvrez **Tester la requête**, renseignez `q=Brazzaville`, puis envoyez la requête. Utilisez `/docs/fr/communes/get` pour une consultation par UUID ou `/docs/fr/arrondissements/by-communes` pour les arrondissements d’une commune. Les exemples géographiques et UUID proposés proviennent du catalogue chargé ; aucun exemple n’est inventé pour une catégorie vide. Le changement de langue conserve l’opération. Les boutons de copie, schémas de réponse et client de requêtes natifs restent accessibles. Ces requêtes suivent les validations et limites de débit normales de l’API.

Le client de requêtes natif occupe tout le viewport, avec son bouton de fermeture intégré à sa barre d’outils. Fermez-le ou appuyez sur Échap pour revenir à l’opération à la même position de lecture. La page conserve l’URL de l’opération tandis que Scalar gère le client et le focus clavier. Les contrôles de requête et panneaux de réponse conservent le comportement et le style de Scalar. Le petit adaptateur CSS du cadre cible la version épinglée de Scalar ; vérifiez les dimensions plein écran et le retour au clavier lors d’une mise à jour de Scalar.

`@fastify/swagger` génère `/openapi.json` directement depuis les schémas des routes ; **Scalar remplace Swagger UI**, pas le générateur OpenAPI. Chaque page d’opération sert sa projection isolée à la même adresse suivie de `/openapi.json`, en conservant les schémas des paramètres et réponses. Les anciennes projections par catégorie `/docs/{fr|en}/spec/{chapitre}.json` restent disponibles, tout comme le contrat complet `/openapi.json`. Aucun schéma n’est maintenu manuellement en double. Les guides, libellés d’interface et descriptions des opérations sont proposés en français et en anglais ; les champs techniques, URL, clés JSON et noms de lieux conservent leurs identifiants d’origine.

Fastify sert la structure de lecture, les styles et le petit script de navigation ; le JavaScript de Scalar se charge uniquement sur les chapitres de référence API, localement. Les polices distantes par défaut, la télémétrie, l’assistance IA et les outils promotionnels développeur sont désactivés ; les requêtes vont directement à cette API sans proxy hébergé par Scalar. Aucun compte Scalar, framework frontend ou service payant n’est nécessaire. La documentation utilise un nonce CSP différent à chaque réponse ; son HTML ne doit pas être mis en cache par un reverse proxy. Les adresses relatives à la racine supposent que l’API est hébergée à la racine du domaine, sans réécriture sous un préfixe de chemin.

Consultez l’[intégration Fastify officielle](https://scalar.com/products/api-references/integrations/fastify) et la [configuration de Scalar](https://scalar.com/products/api-references/configuration). L’interface provient de Scalar ; les guides d’utilisation du dépôt restent disponibles en français et en anglais.

## Ressources et filtres

Utilisez `GET` pour récupérer le JSON ou `HEAD` pour les en-têtes correspondants. Chaque ressource possède une liste et un accès au détail, par exemple `/v1/communes` et `/v1/communes/{id}`. Les identifiants sont des UUID persistants, communs aux exports JSON et de bases de données.

| Route de liste | Ressource | Filtres de parent direct |
|---|---|---|
| `/v1/countries` | Pays | Aucun |
| `/v1/departments` | Départements | `countryId` |
| `/v1/communes` | Communes | `departmentId` |
| `/v1/districts` | Districts | `departmentId` |
| `/v1/arrondissements` | Arrondissements | `communeId` |
| `/v1/urban-communities` | Communautés urbaines | `districtId` |
| `/v1/rural-communities` | Communautés rurales | `districtId` |
| `/v1/neighborhoods` | Quartiers | `communeId`, `arrondissementId`, `urbanCommunityId` |
| `/v1/villages` | Villages | `districtId`, `ruralCommunityId`, `urbanCommunityId` |

Les listes acceptent `q`, `limit` et `offset`. La recherche correspond à une partie du nom, sans distinction de casse ni d’accents ; elle ne fusionne pas les lieux dont les noms se ressemblent. `q` est limité à 100 caractères après suppression des espaces aux extrémités. `limit` vaut 50 par défaut et 100 au maximum ; `offset` commence à 0. Le tri par nom puis UUID est déterministe. Les paramètres inconnus et valeurs invalides sont refusés.

Les filtres de parent direct correspondent à la relation enregistrée. Ainsi, `neighborhoods?communeId=...` sélectionne les quartiers documentés directement sous cette commune. Une route de relation permet d’inclure les descendants rattachés par un arrondissement.

## Commune → arrondissement → quartier

Pour le champ « ville » d’un formulaire, utilisez les communes. Un département homonyme est une ressource distincte avec un autre UUID. Le JavaScript suivant charge les choix connus de Brazzaville depuis l’API locale :

```js
const api = "http://127.0.0.1:3000/v1";

async function get(path) {
  const response = await fetch(api + path);
  if (!response.ok) throw new Error(`Geography request failed: ${response.status}`);
  return response.json();
}

const cities = await get("/communes?q=Brazzaville&limit=100");
const brazzaville = cities.data.find(city => city.name === "Brazzaville");
if (!brazzaville) throw new Error("Brazzaville is not documented in this dataset");

const arrondissements = await get(
  `/communes/${brazzaville.id}/arrondissements?limit=100`
);
const talangai = arrondissements.data.find(row => row.name === "Talangaï");

const neighborhoods = talangai
  ? await get(`/arrondissements/${talangai.id}/neighborhoods?limit=100`)
  : await get(`/communes/${brazzaville.id}/neighborhoods?limit=100`);

// Affichez row.name dans les listes ; conservez row.id comme valeur sélectionnée.
console.log(arrondissements.data, neighborhoods.data);
```

L’exemple demande une page. Utilisez `meta.total`, `meta.limit` et `meta.offset` pour proposer les pages suivantes lorsque nécessaire. Réinitialisez les sélections arrondissement et quartier lorsque la commune change, puis le quartier lorsque l’arrondissement change. Le formulaire doit gérer le chargement, les erreurs et les listes vides.

La route des quartiers d’une commune retourne tous ses quartiers descendants connus, y compris ceux rattachés directement à la commune. Elle ne leur invente pas d’arrondissement. Un formulaire doit permettre de sélectionner ces quartiers directs même si la commune possède aussi des arrondissements ; un arrondissement documenté ne doit pas être obligatoire pour chaque quartier.

| Route de relation | Résultat |
|---|---|
| `/v1/countries/{id}/departments` | Départements du pays |
| `/v1/departments/{id}/communes` | Communes du département |
| `/v1/departments/{id}/districts` | Districts du département |
| `/v1/communes/{id}/arrondissements` | Arrondissements de la commune |
| `/v1/communes/{id}/neighborhoods` | Tous les quartiers connus de la commune |
| `/v1/arrondissements/{id}/neighborhoods` | Quartiers de l’arrondissement |
| `/v1/districts/{id}/urban-communities` | Communautés urbaines du district |
| `/v1/districts/{id}/rural-communities` | Communautés rurales du district |
| `/v1/districts/{id}/villages` | Tous les villages connus du district |
| `/v1/urban-communities/{id}/neighborhoods` | Quartiers de la communauté urbaine |
| `/v1/urban-communities/{id}/villages` | Villages de la communauté urbaine |
| `/v1/rural-communities/{id}/villages` | Villages de la communauté rurale |

Ces listes acceptent `q`, `limit` et `offset`. Elles vérifient l’existence du parent dans la catégorie demandée et conservent les champs de parent direct réels des ressources retournées.

## Réponses, versions et couverture

Une liste retourne `{ data: [...], meta: { total, limit, offset, datasetVersion, coverageStatus } }`. Un détail retourne `{ data: resource, meta: { datasetVersion, coverageStatus } }`. Les champs conservent le sens métier des [exports JSON](formats.fr.md). Un quartier a exactement un parent direct documenté ; les autres champs de parent valent `null`.

Par exemple, le détail `/v1/communes/be83c679-2667-4935-9dad-0f63456298ad` identifie la commune de Brazzaville :

```json
{
  "data": {
    "id": "be83c679-2667-4935-9dad-0f63456298ad",
    "name": "Brazzaville",
    "departmentId": "bf82f843-df29-444b-ba2d-fc9df50f220f"
  },
  "meta": {
    "datasetVersion": "cg-reference-2026-11-12.2",
    "coverageStatus": "partial"
  }
}
```

`/v1/dataset` décrit le référentiel déployé avec `apiVersion`, `serviceVersion`, `contractVersion`, `datasetVersion`, `country`, `reviewedAt` et `sources`. Les métadonnées sources comprennent les droits d’utilisation et les informations de révision. `/v1/coverage` fournit les nombres connus par ressource (`counts`), les dates (`sourceDates`) et les résumés par commune (`communes`), avec `status: "partial"` et `completeGeographicInventory: false`. Ces deux routes suivent la même enveloppe `data`/`meta`. Les anomalies détaillées des sources ne sont pas ajoutées aux réponses ordinaires de lieux.

Le référentiel fourni contient actuellement 398 enregistrements, dont 16 communes et 250 quartiers nommés. Brazzaville possède 9 arrondissements documentés et 74 quartiers nommés. Ces nombres décrivent les enregistrements couverts, pas des totaux géographiques actuels certifiés. Aucun village ni aucune communauté rurale n’ont actuellement de lignes vérifiées. Une liste vide signifie qu’aucune observation connue ne correspond ; elle ne prouve pas l’absence de ces lieux. Coordonnées et frontières ne sont pas déduites. Voir [le référentiel et ses sources](congo-reference.fr.md).

Le préfixe `/v1` (`apiVersion`) versionne le contrat HTTP. `serviceVersion` versionne le logiciel API, `contractVersion` identifie le contrat de données sous-jacent et `datasetVersion` le référentiel factuel. Un serveur expose son jeu de données déployé ; les anciens jeux ne deviennent pas automatiquement consultables. Conservez la version du référentiel avec les résultats enregistrés et utilisez une version de données figée pour reproduire un export.

## Erreurs et cache HTTP

Les erreurs suivent `{ error: { code, message, requestId } }`. L’identifiant de requête permet de retrouver un échec dans les journaux du serveur.

| Statut | Signification |
|---|---|
| `400` | UUID, filtre, pagination ou paramètre inconnu invalide |
| `404` | Route, ressource ou parent de la catégorie demandée introuvable |
| `405` | Méthode non prise en charge sur une route connue ; consulter `Allow` |
| `413` | Corps de requête dépassant la limite du serveur |
| `429` | Limite de requêtes atteinte ; consulter `Retry-After` |
| `500` | Erreur inattendue du serveur avec un message public maîtrisé |

Un parent connu sans enfants documentés retourne `200` et `data: []`. Cela diffère d’un parent introuvable, qui retourne `404`.

Les réponses de données réussies fournissent un `ETag` et une durée de cache public de cinq minutes. Renvoyez cette valeur dans `If-None-Match` pour revalider ; une représentation inchangée retourne `304` sans corps. `HEAD` ne possède pas non plus de corps. Les erreurs et les sondes de disponibilité utilisent `Cache-Control: no-store`.

## Configuration et fonctionnement

| Variable d’environnement | Valeur par défaut | Rôle |
|---|---|---|
| `API_HOST` | `127.0.0.1` | Adresse d’écoute ; choisir explicitement une écoute externe pour l’hébergement |
| `PORT` | `3000` | Port TCP |
| `API_RATE_LIMIT_MAX` | `60` | Nombre maximal de requêtes par client et par minute |
| `TRUSTED_PROXIES` | Non définie | Adresses IP/CIDR restrictifs des proxys de confiance, séparés par des virgules ; les plages `/0` sont refusées |

L’API permet l’accès depuis le navigateur aux ressources publiques en lecture seule sans identifiants. La limitation de débit est en mémoire et s’applique par processus ; elle ne constitue pas un quota global entre plusieurs instances. Les adresses transmises par un proxy sont acceptées uniquement selon la configuration de confiance ; adaptez-la à l’hébergement réel avant de vous appuyer sur les limites par IP. Terminez HTTPS sur l’hébergement ou le reverse proxy choisi.

`/health/live` indique que le processus répond ; `/health/ready` indique que le service est prêt. Le catalogue est chargé et validé avant l’acceptation des requêtes. L’arrêt gère `SIGINT` et `SIGTERM` avec un délai de fermeture borné. Aucun serveur de base de données ni téléchargement distant ne sont nécessaires pour répondre aux requêtes géographiques.

```sh
npm run typecheck:api
npm run test:api
npm run check
```

Les tests comprennent l’injection HTTP et le cycle de vie d’un vrai serveur. `npm run test:acceptance` vérifie séparément la parité des identités sources/API/exports et l’isolation de la CLI empaquetée. Les vérifications d’exports/imports existantes restent dans le parcours du dépôt. Voir [les contributions](../CONTRIBUTING.fr.md).

## Fichiers et imports en base

L’API consulte les données ; elle ne remplit pas votre base et n’exécute pas le SQL d’export. Utilisez la [CLI](generation.fr.md) pour produire du JSON, CSV, Excel ou des exports de bases autonomes. Utilisez le [parcours d’import explicite](seeding.fr.md) pour écrire un paquet de ressources vérifié dans PostgreSQL. Le SDK local optionnel constitue un autre choix d’intégration et ne dépend pas de ce service HTTP.
