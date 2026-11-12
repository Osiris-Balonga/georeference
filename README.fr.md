# GeoReference — République du Congo

[English](README.md) · [Référentiel Congo](docs/congo-reference.fr.md) · [Prise en main](docs/getting-started.fr.md) · [Contribuer](CONTRIBUTING.fr.md)

Générez des fichiers autonomes de départements, communes, districts, arrondissements et quartiers observés dans les sources de la **République du Congo (Congo-Brazzaville, CG/COG)**. La CLI utilise un référentiel intégré, vérifié et accompagné de sa provenance datée ; son parcours géographique par défaut ne télécharge aucune donnée. Votre application lit directement les fichiers. Le SDK reste optionnel.

**État de livraison :** cette documentation décrit la prochaine révision **1.1.0 limitée au Congo**. Elle ne signifie pas que 1.1.0 est publiée. La version npm/GitHub 1.0.0 conserve l'ancien fonctionnement ; `npx georeference` l'utilise tant que la correction n'est pas livrée. Les commandes ci-dessous s'exécutent depuis un checkout de cette révision.

## Générer depuis ce checkout

Utilisez Node.js **24.18.x** et npm :

```sh
npm ci
npm run build
node dist/cli.js
node dist/cli.js arrondissements --city Brazzaville --output ./data/brazzaville-arrondissements
node dist/cli.js neighborhoods --city Pointe-Noire --format csv --output ./data/pointe-noire-neighborhoods
```

La commande par défaut crée un nouveau répertoire `data/georeference/` avec `entities.json`, `coverage.json`, `provenance.json` et `manifest.json`. Elle ne modifie ni le manifeste du projet, ni le fichier de verrouillage, ni les dépendances. Une destination existante est refusée. Après publication, remplacez `node dist/cli.js` par `npx georeference` ; npm peut télécharger l'exécutable, mais le référentiel reste intégré.

## Des données réelles, avec des limites explicites

Le référentiel contient des faits administratifs vérifiés, pas une démonstration fictive ni un catalogue mondial. Il combine des observations électorales publiques de 2022, des lois territoriales de 2024 et un registre national de 2025. Ces dates sont conservées. Il ne prétend **pas** couvrir tous les quartiers, villages, frontières ou coordonnées actuels en 2026.

`coverage.json` indique effectifs du référentiel/de l'export, dates sources, manques de quartiers nommés, observations codées/non classées et conflits non résolus. Un résultat de quartiers vide signifie qu'aucune observation nommée admissible n'est présente ; cela ne prouve pas l'absence de quartiers. `provenance.json` expose les preuves des entités exportées. Voir [couverture et sources](docs/congo-reference.fr.md).

`kind` précise le sens administratif : `department`, `commune`, `district`, `arrondissement`, `urban-community`, `rural-community`, `neighborhood` ou `village`, lorsque vérifié. Un département et sa commune homonyme sont distincts. Un quartier peut dépendre directement d'une commune, d'un arrondissement ou d'une communauté urbaine ; le parent documenté est conservé.

## Commandes et formats

Utilisez `generate` pour tout le référentiel ou sélectionnez `countries`, `departments`, `communes`, `cities` (alias des communes), `districts`, `arrondissements`, `neighborhoods` ou `villages`. Les filtres suivent les identités et descendants vérifiés. Le filtre pays accepte CG/COG ou l'ID Congo conservé ; les autres pays, dont CD/COD, restent hors périmètre.

JSON (plat/hiérarchique), NDJSON, CSV, SQL PostgreSQL, SQLite et GeoJSON sont disponibles, avec gzip/ZIP. Les géométries ne sont incluses que lorsqu'elles existent ; aucun point ni aucune frontière ne sont inventés. Voir [la génération](docs/generation.fr.md) et [les limites des formats](docs/formats.fr.md).

## Fichiers, import en base, SDK optionnel

| Besoin | Solution |
|---|---|
| Ajouter des fichiers géographiques à une application | Générer une fois ; utiliser vos lecteurs |
| Initialiser/actualiser PostgreSQL | Utiliser le seeder avec aperçu, mapping et politique de mise à jour |
| Interroger un instantané local depuis TypeScript | Choisir le SDK de lecture |

La génération n'amorce pas une base. Un script SQL ne répond pas à toutes les questions de clés existantes, champs gérés, révision et reprise. La nouvelle colonne SQL nullable `kind` nécessite une adaptation explicite des tables/mappings gérés existants ; aucune migration silencieuse. Voir [l'amorçage](docs/seeding.fr.md).

## Documentation

| Français | English |
|---|---|
| [Référentiel Congo, couverture et hiérarchie](docs/congo-reference.fr.md) | [Congo reference, coverage and hierarchy](docs/congo-reference.md) |
| [Génération](docs/generation.fr.md) | [Generation](docs/generation.md) |
| [Prise en main et SDK optionnel](docs/getting-started.fr.md) | [Getting started and optional SDK](docs/getting-started.md) |
| [Formats](docs/formats.fr.md) | [Formats](docs/formats.md) |
| [Amorçage PostgreSQL](docs/seeding.fr.md) | [PostgreSQL seeding](docs/seeding.md) |
| [Sources et licences](docs/data-sources.fr.md) | [Sources and licensing](docs/data-sources.md) |
| [Architecture et adaptateurs](docs/architecture.fr.md) | [Architecture and adapters](docs/architecture.md) |
| [Contribuer](CONTRIBUTING.fr.md) | [Contributing](CONTRIBUTING.md) |

## Développement et licence

`npm run check` lance validation TypeScript, tests et compilation. Les changements commencent par les tests ; les pull requests de tâche ciblent `dev`, les livraisons vont de `dev` vers `main`.

Code et documentation : [MIT](LICENSE), © 2026 Osiris Balonga. Les faits conservent leur provenance et les conditions sources ; MIT ne relicencie pas cartes ou publications externes. Les fixtures fictives restent réservées aux tests. Voir [les licences](docs/data-sources.fr.md).
