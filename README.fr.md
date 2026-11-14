# 242Places — République du Congo

[English](README.md) · [Prise en main](docs/getting-started.fr.md) · [Formats](docs/formats.fr.md) · [API HTTP](docs/api.fr.md) · [Contribuer](CONTRIBUTING.fr.md)

Récupérez les données géographiques de la République du Congo (CG/COG) sous forme de listes lisibles ou de ressources applicatives. Choisissez des onglets Excel par catégorie, des CSV avec noms de lieux, des collections JSON séparées ou des exports de bases avec UUID stables et tables métier configurables. Les fichiers générés ne nécessitent aucune dépendance permanente dans le projet.

La version **1.2.0** fournit les exports de ressources Congo. Utilisez `npx 242places@1.2.0` pour choisir explicitement cette version. Les versions précédentes étaient publiées sous le nom de paquet georeference.

## Essayer les données

Utilisez Node.js **24.18.x** et npm :

```sh
npx 242places@1.2.0 generate --format xlsx --output ./exports/congo-excel
npx 242places@1.2.0 neighborhoods --city Brazzaville --format csv --output ./exports/brazzaville-csv
npx 242places@1.2.0 generate --format json --output ./exports/congo-json
```

Ouvrez `congo.xlsx` pour consulter les onglets, les CSV pour les listes, ou des tableaux JSON comme `communes.json`, `arrondissements.json` et `neighborhoods.json` pour les applications. Chaque nouveau dossier contient un résumé humain de couverture/dates dans `README.txt` et les métadonnées techniques d'intégrité dans `manifest.json`. Les preuves détaillées sont facultatives avec `--audit`. Les destinations existantes sont refusées.

## Choisir la sortie selon le besoin

| Besoin | Sortie |
|---|---|
| Consulter ou partager des listes dans un tableur | `xlsx` : onglets par catégorie, noms et rattachements lisibles |
| Utiliser les listes dans plusieurs tableurs | `csv` : un fichier par catégorie, noms plutôt que clés étrangères brutes par défaut |
| Ajouter des données locales à une application | `json` ou `ndjson` : ressources séparées, UUID et relations explicites |
| Initialiser des tables PostgreSQL | `sql-postgres` : scripts de schéma/données séparés, tables configurables |
| Interroger directement une base locale | `sqlite` : tables métier prêtes à consulter |
| Utiliser des géométries fournies | `geojson` : couches demandées, aucune géométrie inventée |

Un CSV contient une table, pas des onglets. Choisissez XLSX pour un classeur à plusieurs feuilles. CSV/XLSX sont des exports de consultation, pas des entrées de seeding. Voir [la génération](docs/generation.fr.md) et [les formats](docs/formats.fr.md).

## Un référentiel Congo daté et partiel

Le référentiel enrichi contient **4 353 enregistrements** : 1 pays, 15 départements, 16 communes, 23 arrondissements, 92 districts, 47 communautés urbaines, 92 communautés rurales, 782 quartiers et 3 285 villages. Les UUID existants sont conservés. La cascade administrative fournie par le mainteneur a été reçue le 14 novembre 2026 ; ses dates d’observation sont inconnues. La couverture reste partielle et aucune géométrie n’est inventée.

Les communes/départements homonymes ont des UUID distincts. Le parent documenté d'un quartier peut être une commune, un arrondissement ou une communauté urbaine. Un résultat vide signale un manque d'observations, pas l'absence de lieux. Voir [le référentiel et ses sources](docs/congo-reference.fr.md).

## Fichiers, import en base et SDK optionnel

Générer des fichiers n'écrit pas dans une base. L'importeur PostgreSQL propose un aperçu en lecture seule et une application distincte ; les tables existantes doivent correspondre au schéma métier choisi. Il ne migre pas silencieusement une application et ne remappe pas des clés primaires arbitraires. Voir [l'import en base](docs/seeding.fr.md).

Le SDK optionnel expose des ressources aux applications choisissant une intégration locale par paquet. Le dépôt contient aussi une application HTTP Fastify séparée utilisant les mêmes ressources géographiques et UUID stables. Elle consulte les données sans exporter de fichiers ni remplir une base. Voir [la prise en main](docs/getting-started.fr.md) et [l’architecture](docs/architecture.fr.md).

## Lancer l’API HTTP en local

Depuis le code source, utilisez Node.js 24.18.x et lancez :

```sh
npm ci
npm run dev:api
```

Ouvrez `http://127.0.0.1:3000/docs` pour la documentation interactive. Les routes comprennent `/v1/communes`, `/v1/communes/{id}/arrondissements` et `/v1/arrondissements/{id}/neighborhoods`. L’API est publique en lecture seule, avec des ressources paginées et des métadonnées explicites de version/couverture partielle. Voir [le guide API](docs/api.fr.md) pour la configuration, les exemples et la distinction entre relations directes et descendantes.

Consultez la [documentation produit et la référence API hébergées](https://two42places.onrender.com/). Elles présentent le CLI, les exports, l’import SQL et le SDK en français et en anglais. Le paquet npm reste la CLI et le SDK optionnel : `npx 242places` génère des fichiers autonomes. Voir [le déploiement](docs/deployment.fr.md) pour héberger vous-même l’API et la documentation.

## Documentation

| Français | English |
|---|---|
| [Prise en main](docs/getting-started.fr.md) | [Getting started](docs/getting-started.md) |
| [Génération et filtres](docs/generation.fr.md) | [Generation and filters](docs/generation.md) |
| [Formats et tables](docs/formats.fr.md) | [Formats and tables](docs/formats.md) |
| [Import en base](docs/seeding.fr.md) | [Database import](docs/seeding.md) |
| [Référentiel et sources](docs/congo-reference.fr.md) | [Reference and sources](docs/congo-reference.md) |
| [Migration](docs/migration.fr.md) | [Migration](docs/migration.md) |
| [API HTTP](docs/api.fr.md) | [HTTP API](docs/api.md) |
| [Deployment](docs/deployment.md) | [Déploiement](docs/deployment.fr.md) |
| [Architecture](docs/architecture.fr.md) | [Architecture](docs/architecture.md) |
| [Contribuer](CONTRIBUTING.fr.md) | [Contributing](CONTRIBUTING.md) |

## Développement et licence

`npm run check` vérifie le cœur et l’API. Utilisez `npm run test:api` pour les comportements API, puis `npm run build:api` et `npm run start:api` pour le serveur compilé. Les PR de tâche ciblent `dev` ; les livraisons vont de `dev` à `main`.

Code/documentation : [MIT](LICENSE), © 2026 Osiris Balonga. Les faits conservent provenance et conditions sources ; MIT ne relicencie pas les publications/cartes externes. Les fixtures fictives restent réservées aux tests. Voir [les licences](docs/data-sources.fr.md).
