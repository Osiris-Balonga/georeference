# Changelog / Historique

## 1.1.0 — Unreleased / Non publié

### English

Scope corrected to Republic of the Congo (CG/COG) exclusively. Default generation uses bundled curated facts with source observations from 2022–2025, with no geographic network download. Add kind-specific commands, commune/arrondissement descendant filters, and distinct commune/department identities. Neighborhood parents follow evidence and can be a commune, arrondissement, or urban community.

Generated packages include explicit partial coverage and per-entity provenance metadata; unnamed, unresolved, and conflicting observations remain visible gaps. Add optional SDK administrative lookups and nullable SQL `kind`; older managed tables require an explicit migration or compatible column mapping. Synthetic fixtures are tests only. This section describes a planned correction, not an npm/GitHub release; the published 1.0.0 behavior below remains historical.

### Français

Périmètre corrigé : République du Congo (CG/COG) exclusivement. La génération utilise par défaut des faits vérifiés intégrés, observés dans les sources de 2022–2025, sans téléchargement géographique. Ajout de commandes par type administratif, de filtres descendants par commune/arrondissement et d'identités distinctes pour commune/département. Le parent d'un quartier suit les preuves et peut être une commune, un arrondissement ou une communauté urbaine.

Les paquets générés comprennent couverture explicitement partielle et provenance par entité ; observations sans nom, non résolues et contradictoires restent des lacunes visibles. Ajout de consultations administratives au SDK optionnel et de `kind` SQL nullable ; les anciennes tables gérées nécessitent une migration explicite ou un mapping compatible. Les données fictives restent réservées aux tests. Cette section décrit une correction prévue, pas une publication npm/GitHub ; le comportement 1.0.0 ci-dessous est historique.

## 1.0.0

### English

CLI-first generation: the default command generates country files directly in a target project, with automatic GeoNames download, offline source input, geographic filters and existing-destination protection. No project dependency installation is required; the snapshot SDK remains optional.

Initial V1: validated geographic snapshots; country/subdivision/type selection; JSON, NDJSON, CSV, PostgreSQL SQL, SQLite, and GeoJSON adapters; manifest verification and compression; PostgreSQL seeding; local read SDK; offline GeoNames ingestion; MIT software and bilingual public documentation.

This entry describes the V1 codebase. A package version in source is not evidence of an npm publication or hosted deployment. Geographic source coverage and licensing are separate from software versioning.

### Français

Génération par commande : le parcours par défaut génère les fichiers de pays directement dans le projet cible, avec téléchargement GeoNames, entrée hors ligne, filtres géographiques et protection des destinations existantes. Aucune dépendance à installer dans le projet ; le SDK d'instantanés reste optionnel.

Première V1 : instantanés géographiques validés ; sélection par pays/subdivision/type ; adaptateurs JSON, NDJSON, CSV, SQL PostgreSQL, SQLite et GeoJSON ; manifestes vérifiables et compression ; amorçage PostgreSQL ; SDK de lecture local ; ingestion GeoNames hors ligne ; logiciel MIT et documentation publique bilingue.

Cette entrée décrit le code de la V1. Un numéro de version dans le dépôt ne prouve ni une publication npm ni un déploiement hébergé. Couverture et licences géographiques restent distinctes de la version logicielle.
