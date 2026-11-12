# GeoReference — République du Congo

[English](README.md) · [Prise en main](docs/getting-started.fr.md) · [Formats](docs/formats.fr.md) · [Contribuer](CONTRIBUTING.fr.md)

Récupérez les données géographiques de la République du Congo (CG/COG) sous forme de listes lisibles ou de ressources applicatives. Choisissez des onglets Excel par catégorie, des CSV avec noms de lieux, des collections JSON séparées ou des exports de bases avec UUID stables et tables métier configurables. Les fichiers générés ne nécessitent aucune dépendance permanente dans le projet.

La version **1.1.0** fournit les exports de ressources Congo. Utilisez `npx georeference@1.1.0` pour choisir explicitement cette version. La version 1.0.0 utilisait l’ancien export de liste de pays.

## Essayer les données

Utilisez Node.js **24.18.x** et npm :

```sh
npx georeference@1.1.0 generate --format xlsx --output ./exports/congo-excel
npx georeference@1.1.0 neighborhoods --city Brazzaville --format csv --output ./exports/brazzaville-csv
npx georeference@1.1.0 generate --format json --output ./exports/congo-json
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

Le référentiel vérifié contient **398 enregistrements** : 1 pays, 15 départements, 16 communes, 23 arrondissements, 89 districts, 4 communautés urbaines et 250 quartiers nommés. Ce sont les enregistrements couverts, pas des totaux nationaux certifiés pour chaque catégorie. Les observations datent de 2022–2025 ; aucun inventaire actuel exhaustif des villages/quartiers ni aucune géométrie ne sont annoncés.

Les communes/départements homonymes ont des UUID distincts. Le parent documenté d'un quartier peut être une commune, un arrondissement ou une communauté urbaine. Un résultat vide signale un manque d'observations, pas l'absence de lieux. Voir [le référentiel et ses sources](docs/congo-reference.fr.md).

## Fichiers, import en base et SDK optionnel

Générer des fichiers n'écrit pas dans une base. L'importeur PostgreSQL propose un aperçu en lecture seule et une application distincte ; les tables existantes doivent correspondre au schéma métier choisi. Il ne migre pas silencieusement une application et ne remappe pas des clés primaires arbitraires. Voir [l'import en base](docs/seeding.fr.md).

Le SDK optionnel expose des ressources aux applications choisissant cette intégration. Son modèle prépare une future API ; **cette version ne déploie aucune API HTTP**. Voir [la prise en main](docs/getting-started.fr.md) et [l'architecture](docs/architecture.fr.md).

## Documentation

| Français | English |
|---|---|
| [Prise en main](docs/getting-started.fr.md) | [Getting started](docs/getting-started.md) |
| [Génération et filtres](docs/generation.fr.md) | [Generation and filters](docs/generation.md) |
| [Formats et tables](docs/formats.fr.md) | [Formats and tables](docs/formats.md) |
| [Import en base](docs/seeding.fr.md) | [Database import](docs/seeding.md) |
| [Référentiel et sources](docs/congo-reference.fr.md) | [Reference and sources](docs/congo-reference.md) |
| [Migration](docs/migration.fr.md) | [Migration](docs/migration.md) |
| [Architecture](docs/architecture.fr.md) | [Architecture](docs/architecture.md) |
| [Contribuer](CONTRIBUTING.fr.md) | [Contributing](CONTRIBUTING.md) |

## Développement et licence

`npm run check` lance validation TypeScript, tests et compilation. Les PR de tâche ciblent `dev` ; les livraisons vont de `dev` à `main`.

Code/documentation : [MIT](LICENSE), © 2026 Osiris Balonga. Les faits conservent provenance et conditions sources ; MIT ne relicencie pas les publications/cartes externes. Les fixtures fictives restent réservées aux tests. Voir [les licences](docs/data-sources.fr.md).
