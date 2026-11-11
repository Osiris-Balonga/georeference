# GeoReference

[English](README.md) · [Prise en main](docs/getting-started.fr.md) · [Formats](docs/formats.fr.md) · [Contribuer](CONTRIBUTING.fr.md)

Des données géographiques versionnées, des exports portables et un amorçage de base reproductible.

GeoReference est une bibliothèque TypeScript et un outil en ligne de commande pour construire un référentiel cohérent de pays, subdivisions administratives et localités. Conservez les identifiants entre les exports, sélectionnez un périmètre géographique et chargez les données dans PostgreSQL avec des règles de mise à jour explicites.

## Ce que propose la V1

- Instantanés SQLite validés et versionnés depuis du JSON/NDJSON canonique ou des fichiers texte GeoNames locaux.
- Sélection par pays, descendants d'une subdivision et type d'entité, avec les ancêtres nécessaires inclus par défaut.
- Inclusion indépendante des coordonnées ponctuelles et des frontières Polygon/MultiPolygon.
- Exports JSON (plats ou hiérarchiques), NDJSON, CSV, SQL PostgreSQL, SQLite et GeoJSON.
- Manifestes d'export avec provenance, options, nombres d'entités et sommes de contrôle SHA-256 ; compression gzip et ZIP.
- Amorçage PostgreSQL avec aperçu par défaut, application explicite, mise à jour des champs gérés, identifiants stables et reprise par lots.
- SDK local de lecture pour rechercher les pays/subdivisions et parcourir les localités.

Ce dépôt contient le logiciel et un petit exemple **fictif**. Il ne contient pas de référentiel mondial complet ni d'API hébergée. La couverture dépend des sources fournies ; la licence MIT du logiciel ne modifie pas celle des jeux de données.

## Essayer en local

Utilisez Node.js **24.18.x** et npm. Installez le paquet compilé dans votre projet :

```sh
npm install georeference
npx --no-install georeference --help
```

Pour construire depuis les sources et essayer l'exemple fictif fourni :

```sh
git clone https://github.com/Osiris-Balonga/georeference.git
cd georeference
npm ci
npm run build
node dist/cli.js snapshot --input examples/sample.ndjson --metadata examples/metadata.json --output data/example.sqlite
node dist/cli.js export --snapshot data/example.sqlite --format json --country XZ --coordinates --boundaries --output exports/example-json
node dist/cli.js verify --package exports/example-json
```

Le répertoire de destination d'un export doit être nouveau. Le [guide complet](docs/getting-started.fr.md) présente aussi l'ingestion GeoNames, l'amorçage PostgreSQL et le SDK.

## Trois façons d'utiliser les données

| Besoin | Solution |
|---|---|
| Télécharger ou échanger un instantané | Exporter des fichiers accompagnés d'un manifeste |
| Initialiser/mettre à jour une base applicative | Utiliser le seeder PostgreSQL avec une politique de mise à jour examinée |
| Consulter le référentiel depuis une application | Utiliser le SDK de lecture sur un instantané local |

Un export SQL ne suffit pas à constituer un seeder universel. L'import doit aussi gérer les clés existantes, les champs gérés, les conflits, les révisions, les transactions et la reprise. Voir [l'import en base](docs/seeding.fr.md).

## Documentation

| Français | English |
|---|---|
| [Prise en main](docs/getting-started.fr.md) | [Getting started](docs/getting-started.md) |
| [Formats pris en charge et limites](docs/formats.fr.md) | [Supported formats and limits](docs/formats.md) |
| [Amorçage PostgreSQL](docs/seeding.fr.md) | [PostgreSQL seeding](docs/seeding.md) |
| [Sources et licences des données](docs/data-sources.fr.md) | [Data sources and licenses](docs/data-sources.md) |
| [Architecture et adaptateurs](docs/architecture.fr.md) | [Architecture and adapters](docs/architecture.md) |
| [Contribuer](CONTRIBUTING.fr.md) | [Contributing](CONTRIBUTING.md) |

Les guides publics sont maintenus dans les deux langues. Les identifiants d'API, champs et commandes restent anglais.

## Développement

```sh
npm ci
npm run check
```

Les changements de comportement commencent par les tests. Les branches de tâche ciblent `dev` ; les pull requests de livraison vont de `dev` vers `main`. Voir [CONTRIBUTING.fr.md](CONTRIBUTING.fr.md) pour le workflow et les vérifications PostgreSQL.

## Licence

Logiciel et exemples fictifs : [MIT](LICENSE), © 2026 Osiris Balonga. Données GeoNames : [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), avec attribution GeoNames obligatoire. Toute autre source conserve ses conditions. Lire [les licences des données](docs/data-sources.fr.md) avant de redistribuer des exports.
