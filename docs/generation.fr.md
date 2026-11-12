# Générer des listes et des ressources applicatives

[English](generation.md) · [Accueil](../README.fr.md) · [Formats](formats.fr.md)

Ce guide décrit la refonte 1.1.0 non publiée. Compilez ce checkout avec Node.js 24.18.x, `npm ci` et `npm run build`. npm 1.0.0 ne fournit pas ces sorties. Après livraison, remplacez `node dist/cli.js` par `npx georeference`.

## Choisir la sortie

```sh
node dist/cli.js generate --format xlsx --output ./exports/congo-excel
node dist/cli.js generate --format csv --output ./exports/congo-csv
node dist/cli.js generate --format json --output ./exports/congo-json
node dist/cli.js generate --format sql-postgres --output ./exports/congo-postgres
```

Chaque `--output` désigne un **nouveau dossier**, pas un fichier. Les chemins relatifs partent du dossier courant du terminal : l'exemple CSV écrit dans `exports/congo-csv/`, pas dans un précédent dossier JSON. Les destinations existantes sont refusées ; dépendances/fichiers de paquet du consommateur restent intacts. Le référentiel géographique est intégré.

Chaque paquet contient `README.txt` pour couverture/dates et `manifest.json` pour l'intégrité. `--audit` ajoute `coverage.json`/`provenance.json` détaillés ; ce ne sont pas des lignes géographiques.

## Langue et identifiants

Les en-têtes/fichiers CSV et les onglets utilisent le français par défaut. `--language en` choisit l'anglais. Les collections/relations JSON gardent des champs applicatifs anglais stables. Les UUID figurent dans les formats applicatifs et restent masqués dans les listes sauf avec `--include-ids`.

```sh
node dist/cli.js generate --format xlsx --language en --output ./exports/congo-excel-en
node dist/cli.js communes --format csv --include-ids --output ./exports/communes-with-ids
node dist/cli.js generate --format json --audit --output ./exports/congo-audited
```

## Filtrer les catégories et lieux

| Commande | Ressource sélectionnée |
|---|---|
| `countries` | République du Congo uniquement |
| `departments` | Départements |
| `communes`, `cities` | Communes ; `cities` est un alias, pas tous les lieux peuplés |
| `districts` | Districts |
| `arrondissements` | Arrondissements communaux |
| `neighborhoods` | Quartiers nommés retenus dans le référentiel |
| `villages` | Villages nommés lorsqu'une preuve a été retenue |
| `generate` | Toutes les ressources sélectionnées |

```sh
node dist/cli.js arrondissements --city Brazzaville --output ./exports/brazzaville-arrondissements
node dist/cli.js neighborhoods --city Brazzaville --arrondissement 6 --format csv --output ./exports/talangai-csv
node dist/cli.js neighborhoods --city Pointe-Noire --format xlsx --output ./exports/pointe-noire-excel
```

`--city` accepte un nom ou UUID de commune. `--arrondissement` accepte un nom/UUID ; un numéro exige `--city`. Le périmètre est CG/COG ; CD/COD est un autre pays et est refusé. Les parents nécessaires restent dans leur catégorie : le total peut dépasser le nombre de quartiers demandés.

Les ressources publiques exigent des UUID typés et des relations fermées. Ancêtres manquants, enregistrements génériques non typés et anciens arbres d'entités mélangées ne sont pas convertis silencieusement. Voir [la migration](migration.fr.md).

## Noms SQL et compression

`--sql-config ./sql-names.json` fournit les noms de schéma/tables. `--schema-mode data-only` omet la génération du schéma PostgreSQL ; `--sql-mode insert-only` préserve les lignes ayant le même UUID. Voir [les formats](formats.fr.md) et [l'import en base](seeding.fr.md).

`--compression gzip` compresse les fichiers séparément. ZIP contient son manifeste interne ; extrayez-le dans un nouveau dossier avant import. Gardez README/manifeste avec les exports partagés. `verify --package DIRECTORY` contrôle l'intégrité, pas l'exhaustivité géographique.

## Géométrie et couverture

Coordonnées et frontières sont indépendantes. Le référentiel documentaire ne fournit pas de géométrie. GeoJSON exige `--coordinates` et/ou `--boundaries` ; la géométrie absente reste nulle. Aucun nom, parent, point ni polygone n'est déduit pour combler les manques.

Le référentiel est partiel et daté. Une catégorie vide ne déclare pas le territoire vide. Filtrer ou mettre à jour le logiciel ne rend pas une observation de 2022 actuelle en 2026. Voir [couverture et sources](congo-reference.fr.md).
