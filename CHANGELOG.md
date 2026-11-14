# Changelog / Historique

## 1.2.1 — 2026-11-14

English: exported manifests now read their generator version from the installed package metadata, preventing version drift. Geographic UUIDs and data are unchanged.

Français : les manifestes d’export lisent désormais la version du générateur dans le paquet installé, afin d’éviter un décalage de version. Les UUID géographiques et les données sont inchangés.

## 1.2.0 — 2026-11-14

### English

Rename the product and npm CLI to **242Places** (`npx 242places`), retaining stable geographic UUIDs and existing resource contracts. Earlier `georeference` installations remain available. Include the administrative cascade reconciliation: 4,353 known places, including 88 Brazzaville neighborhoods; coverage remains partial and source-dated.

Add a read-only Fastify API with native Scalar operation pages and a shared bilingual documentation shell. Product guides now cover CLI generation, JSON/CSV/Excel, SQL/SQLite, controlled database import and the optional SDK. The site root opens documentation; language and theme follow browser/system preferences with English/dark fallbacks and persistent manual choices. Deploy the API and documentation together on Render.

### Français

Le produit et la CLI npm deviennent **242Places** (`npx 242places`), en conservant les UUID géographiques et les contrats de ressources. Les installations précédentes de `georeference` restent disponibles. Le rapprochement de la cascade administrative porte le référentiel à 4 353 lieux connus, dont 88 quartiers de Brazzaville ; la couverture reste partielle et datée selon les sources.

Ajout de l’API Fastify en lecture seule, des pages d’opération natives Scalar et d’une documentation bilingue commune. Les guides produit couvrent le CLI, JSON/CSV/Excel, SQL/SQLite, l’import contrôlé en base et le SDK optionnel. La racine du site ouvre la documentation ; langue et thème suivent le navigateur et le système, avec l’anglais et le sombre comme replis et mémorisation des choix manuels. API et documentation sont déployées ensemble sur Render.

## 1.1.0 — 2026-11-12

### English

Redesign public exports for their recipients: XLSX category worksheets, readable CSV files by category, separate JSON/NDJSON collections with formatted JSON arrays, and PostgreSQL/SQLite business tables with configurable names. Public resources use UUIDs assigned once in a versioned identity registry; relationships have explicit fields. Preserve earlier identity correspondence for deliberate migrations.

Default packages include a human coverage summary; detailed provenance/conflict reports are opt-in with `--audit`. CSV/XLSX are presentation outputs, not seed inputs. The public resource importer has preview/apply and stable-UUID updates; schema creation does not migrate arbitrary application tables or remap local keys. Legacy canonical helpers remain compatibility components.

Scope is Republic of Congo (CG/COG) only. The unchanged factual inventory has 398 records with geographic observations from 2022–2025 and explicit partial coverage. No exhaustive villages/neighborhoods, invented geometry, hosted HTTP API, MongoDB migration or unverified SQL dialect is claimed. Package availability is verified separately on npm.

### Français

Refonte des sorties selon leurs destinataires : onglets XLSX par catégorie, CSV lisibles séparés, collections JSON/NDJSON distinctes avec tableaux JSON indentés et tables métier PostgreSQL/SQLite aux noms configurables. Les ressources publiques utilisent des UUID attribués une fois dans un registre versionné ; leurs relations ont des champs explicites. La correspondance avec les anciennes identités reste disponible pour une migration examinée.

Les paquets portent un résumé humain de couverture ; les preuves/conflits détaillés sont facultatifs avec `--audit`. CSV/XLSX servent à la consultation, pas au seeding. L’importeur de ressources distingue aperçu/application et actualise par UUID stable ; créer le schéma ne migre pas des tables applicatives arbitraires et ne remappe pas les clés locales. Les helpers canoniques restent des composants de compatibilité.

Périmètre : République du Congo (CG/COG) uniquement. L’inventaire factuel inchangé compte 398 enregistrements observés dans les sources de 2022–2025, avec couverture explicitement partielle. Aucun inventaire exhaustif de villages/quartiers, géométrie inventée, API HTTP hébergée, migration MongoDB ou dialecte SQL non vérifié n’est annoncé. La disponibilité du paquet se vérifie séparément sur npm.

## 1.0.0

### English

CLI-first generation: the default command generates country files directly in a target project, with automatic GeoNames download, offline source input, geographic filters and existing-destination protection. No project dependency installation is required; the snapshot SDK remains optional.

Initial V1: validated geographic snapshots; country/subdivision/type selection; JSON, NDJSON, CSV, PostgreSQL SQL, SQLite, and GeoJSON adapters; manifest verification and compression; PostgreSQL seeding; local read SDK; offline GeoNames ingestion; MIT software and bilingual public documentation.

This entry describes the V1 codebase. A package version in source is not evidence of an npm publication or hosted deployment. Geographic source coverage and licensing are separate from software versioning.

### Français

Génération par commande : le parcours par défaut génère les fichiers de pays directement dans le projet cible, avec téléchargement GeoNames, entrée hors ligne, filtres géographiques et protection des destinations existantes. Aucune dépendance à installer dans le projet ; le SDK d'instantanés reste optionnel.

Première V1 : instantanés géographiques validés ; sélection par pays/subdivision/type ; adaptateurs JSON, NDJSON, CSV, SQL PostgreSQL, SQLite et GeoJSON ; manifestes vérifiables et compression ; amorçage PostgreSQL ; SDK de lecture local ; ingestion GeoNames hors ligne ; logiciel MIT et documentation publique bilingue.

Cette entrée décrit le code de la V1. Un numéro de version dans le dépôt ne prouve ni une publication npm ni un déploiement hébergé. Couverture et licences géographiques restent distinctes de la version logicielle.
