# Prise en main

[English](getting-started.md) · [Référentiel Congo](congo-reference.fr.md) · [Accueil](../README.fr.md)

Ce guide concerne la prochaine révision 1.1.0 limitée au Congo, pas l'ancienne version 1.0.0 publiée. Avant sa livraison, construisez un checkout de cette révision ; un clone par défaut ou npm `latest` ne la contient pas nécessairement.

## Générer puis lire directement les fichiers

Utilisez Node.js 24.18.x et npm :

```sh
npm ci
npm run build
node dist/cli.js
node dist/cli.js verify --package ./data/georeference
```

La CLI utilise le référentiel intégré de la République du Congo et crée un nouveau répertoire contenant `entities.json`, `coverage.json`, `provenance.json` et `manifest.json`. Aucun téléchargement géographique ni installation du SDK. Après publication, `npx georeference` fournira ce point d'entrée depuis le projet cible ; npm peut télécharger l'outil lui-même.

Votre application lit `entities.json` avec son propre lecteur. La racine suit `{ metadata, entities }`. Conservez couverture/provenance et manifeste : un nombre de lignes ne garantit pas l'exhaustivité géographique. Voir [la génération](generation.fr.md) pour les sélecteurs de types, filtres de commune/arrondissement, compression et [la couverture](congo-reference.fr.md) pour les manques datés.

## Sélectionner des unités administratives réelles

```sh
node dist/cli.js communes --output ./data/congo-communes
node dist/cli.js arrondissements --city Brazzaville --output ./data/brazzaville-arrondissements
node dist/cli.js neighborhoods --city Brazzaville --arrondissement 2 --output ./data/bacongo-neighborhoods
node dist/cli.js departments --country CG --format csv --output ./data/congo-departments
```

`cities` est un alias de `communes`. Un numéro d'arrondissement nécessite sa commune avec `--city`. Le pays est limité à CG/COG ; CD/COD désigne un autre pays et est refusé. Conservez les dates sources lors de l'affichage d'un quartier : le filtrage ne transforme pas une observation de 2022 en inventaire exhaustif de 2026.

## Option : préparer un instantané Congo local

Pour consulter le référentiel intégré via le SDK optionnel, créez directement un instantané interne :

```sh
node dist/cli.js snapshot --output ./data/congo.sqlite
node dist/cli.js inspect --snapshot ./data/congo.sqlite
```

Ce parcours intégré ne nécessite aucun fichier input/metadata. `verify --package` contrôle l'intégrité des fichiers ; il ne certifie ni l'exhaustivité géographique ni le statut juridique actuel.

### Source personnalisée

La génération par défaut ne nécessite pas d'instantané préparé. Pour une ingestion personnalisée, les fichiers suivants sont **vos propres entrées CG réelles et validées**, pas des données fictives distribuées. Fournissez `--input` et `--metadata` ensemble :

```sh
node dist/cli.js snapshot --input ./sources/congo.ndjson --metadata ./sources/congo-metadata.json --output ./data/congo.sqlite
node dist/cli.js inspect --snapshot ./data/congo.sqlite
node dist/cli.js export --snapshot ./data/congo.sqlite --country CG --format ndjson --compression gzip --output ./exports/congo
```

Le contrat de métadonnées contient `contractVersion`, `datasetVersion` et `sources` ; chaque source contient `name`, `url`, `license`, `attribution` et `revision`. Les entités ont `id` stable, `entityType`, `name`, `countryId` et `parentId` ; `kind` ajoute le sens administratif. Les champs facultatifs sont notamment `codes`, `names` localisés, `level`, `coordinates` et `boundary` Polygon/MultiPolygon.

`entityType` est une classe de stockage (`country`, `subdivision`, `locality`) ; utilisez `kind` pour distinguer commune, arrondissement et quartier. Un pays se référence lui-même dans `countryId` et possède `parentId: null`. Les parents doivent exister et respecter la hiérarchie documentée. L'identité pays `geonames:2260494` est conservée. Les instantanés/entrées CLI doivent être limités au Congo et conserver leur propre couverture/provenance ; ils n'héritent pas des observations intégrées.

L'export `sqlite` directement interrogeable suit le schéma relationnel d'export ; ce n'est pas l'instantané interne lu par `Snapshot.open`. Les coordonnées utilisent `longitude`/`latitude` ; les positions GeoJSON suivent `[longitude, latitude]`. Aucune géométrie n'est reconstruite à partir d'un nom ou d'un parent deviné.

## Amorcer PostgreSQL séparément

```sh
node dist/cli.js generate --format ndjson --output ./exports/congo-seed
node dist/cli.js seed --package ./exports/congo-seed --create-schema
node dist/cli.js seed --package ./exports/congo-seed --create-schema --apply
```

Définissez `DATABASE_URL` dans votre environnement avant l'import. L'aperçu est le défaut ; `--apply` écrit en base. Couverture/provenance sont des métadonnées, pas des fichiers d'entités supplémentaires. Les tables gérées existantes nécessitent la colonne nullable `kind` ou un mapping explicite avant l'import de données typées. Voir [l'amorçage](seeding.fr.md) pour migration, révisions, clés locales et reprise.

## SDK optionnel

Générer les fichiers ne nécessite pas `npm install georeference`. Les applications souhaitant l'API de consultation peuvent construire/installer le paquet de cette révision, par exemple avec l'archive indiquée par `npm pack`. Avant publication, l'ancien paquet npm 1.0.0 ne fournit pas les nouvelles méthodes de types administratifs.

```ts
import { Snapshot, createClient } from 'georeference';

const snapshot = Snapshot.open('./data/congo.sqlite');
try {
  const client = createClient(snapshot);
  console.log(client.getCountry('CG'));
  console.log(client.listCommunes());
} finally {
  snapshot.close();
}
```

`listArrondissements(communeId)` et `listNeighborhoods(parentSubdivisionId)` utilisent les IDs de parents enregistrés. Les résultats dépendent des types et de la couverture de l'instantané. Gardez-le ouvert pendant les itérations puis fermez-le. Le SDK lit les données ; il n'amorce ni ne synchronise une base applicative.

Pour accéder directement à la révision intégrée, `await loadCongoReference()` (exporté par `georeference`) renvoie ses `metadata`, `entities`, `coverage`, `provenance` par entité et `issues` validés. Cette intégration applicative est optionnelle et indépendante de la génération des fichiers autonomes.
