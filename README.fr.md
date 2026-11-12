# GeoReference

[English](README.md) · [Prise en main](docs/getting-started.fr.md) · [Formats](docs/formats.fr.md) · [Contribuer](CONTRIBUTING.fr.md)

Des données géographiques versionnées, des exports portables et un amorçage de base reproductible.

GeoReference génère des fichiers de données géographiques directement dans votre projet. Exécutez la commande une fois, conservez les fichiers et utilisez-les sans dépendance GeoReference à l'exécution. Un SDK TypeScript optionnel permet aux applications de consulter des instantanés locaux.

## Ce que propose la V1

- Génération des pays en une commande depuis GeoNames, avec entrée hors ligne et filtrage géographique.
- Instantanés SQLite validés et versionnés depuis du JSON/NDJSON canonique ou des fichiers texte GeoNames locaux.
- Sélection par pays, descendants d'une subdivision et type d'entité, avec les ancêtres nécessaires inclus par défaut.
- Inclusion indépendante des coordonnées ponctuelles et des frontières Polygon/MultiPolygon.
- Exports JSON (plats ou hiérarchiques), NDJSON, CSV, SQL PostgreSQL, SQLite et GeoJSON.
- Manifestes d'export avec provenance, options, nombres d'entités et sommes de contrôle SHA-256 ; compression gzip et ZIP.
- Amorçage PostgreSQL avec aperçu par défaut, application explicite, mise à jour des champs gérés, identifiants stables et reprise par lots.
- SDK local de lecture pour rechercher les pays/subdivisions et parcourir les localités.

La commande par défaut télécharge les informations de pays GeoNames ; le dépôt contient le logiciel et un petit exemple **fictif**. Les autres couvertures dépendent des sources fournies. Les données GeoNames sont sous CC BY 4.0 ; la licence MIT du logiciel ne modifie pas celle des jeux de données.

## Essayer en local

Utilisez Node.js **24.18.x** et npm. La distribution npm attend sa publication ; le parcours ponctuel prévu est :

```sh
npx georeference
npx georeference countries --country FR,CG --format csv --output ./data/countries
```

La première commande crée `data/georeference/entities.json` et `manifest.json`. Le JSON contient `{ metadata, entities }`. `--output` désigne un nouveau dossier, pas un nom de fichier. La commande préserve les destinations existantes et ne modifie ni le manifeste du projet, ni le fichier de verrouillage, ni les dépendances. `npx` télécharge/met en cache l'outil hors du projet ; votre application lit directement les fichiers générés. Voir [la génération en une commande](docs/getting-started.fr.md) pour l'usage hors ligne et les six formats.

Pour exécuter cette révision depuis les sources :

```sh
git clone https://github.com/Osiris-Balonga/georeference.git
cd georeference
npm ci
npm run build
node dist/cli.js
```

Le répertoire de destination d'un export doit être nouveau. Le [guide complet](docs/getting-started.fr.md) présente aussi l'ingestion GeoNames, l'amorçage PostgreSQL et le SDK.

## SDK optionnel

Seules les applications qui souhaitent utiliser l'API de consultation des instantanés ont besoin de `npm install georeference` après publication. La génération de fichiers JSON, CSV ou autres ne nécessite pas d'ajouter cette dépendance. Voir [l'exemple SDK](docs/getting-started.fr.md#sdk-optionnel).

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
| [Génération en une commande](docs/generation.fr.md) | [One-shot generation](docs/generation.md) |
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
