# Prise en main

[English](getting-started.md) · [Accueil](../README.fr.md)

## Générer directement les fichiers

Commencez par [la génération en une commande](generation.fr.md) : `npx georeference` génère les fichiers de pays sans ajouter de dépendance au projet. Le SDK est optionnel. La publication npm est en attente ; le guide explique aussi comment exécuter cette révision depuis les sources. Les sections suivantes couvrent la préparation avancée des sources, les exports et l'amorçage en base.

## Construire et créer un instantané

Prérequis : Node.js 24.18.x, npm et assez d'espace disque pour les instantanés/exports. PostgreSQL n'est nécessaire que pour l'amorçage d'une base PostgreSQL. SQLite utilise le module `node:sqlite` intégré à Node.

```sh
npm ci
npm run build
node dist/cli.js --help
node dist/cli.js snapshot --input examples/sample.ndjson --metadata examples/metadata.json --output data/example.sqlite
node dist/cli.js inspect --snapshot data/example.sqlite
```

Les entités fournies sont fictives. Le fichier de métadonnées contient `contractVersion`, `datasetVersion` et `sources` ; chaque source déclare `name`, `url`, `license`, `attribution` et `revision`. Les entités ont les champs stables `id`, `entityType`, `name`, `countryId` et `parentId`. Les champs facultatifs sont `codes`, les `names` localisés, le `level` administratif, les `coordinates` et la `boundary` Polygon/MultiPolygon.

Un pays se référence lui-même dans `countryId` et possède `parentId: null`. Tout autre parent doit exister dans l'instantané. Les objets de coordonnées utilisent les champs nommés `longitude` et `latitude` ; les positions GeoJSON suivent `[longitude, latitude]`. La création valide le graphe et les géométries. Utilisez un nouveau chemin de sortie plutôt que d'écraser un instantané existant.

## Sélectionner et exporter

```sh
node dist/cli.js export --snapshot data/example.sqlite --country XZ --types locality --coordinates --format ndjson --compression gzip --output exports/localities
node dist/cli.js verify --package exports/localities
node dist/cli.js export --snapshot data/example.sqlite --subdivision example:region --format json --layout hierarchical --output exports/region-tree
node dist/cli.js export --snapshot data/example.sqlite --format geojson --coordinates --boundaries --output exports/map-layers
```

Les filtres de pays acceptent les IDs stables ou les codes pays. Plusieurs IDs/types se séparent par des virgules. Le filtre de subdivision inclut ses descendants administratifs ; il n'effectue pas d'intersection spatiale. Les ancêtres nécessaires sont ajoutés par défaut et signalés comme contexte. `--no-ancestors` rend explicites les références externes à la sélection ; un importeur doit les résoudre en cible.

Coordonnées et frontières sont exclues tant qu'elles ne sont pas demandées. Une géométrie absente reste absente ; le manifeste indique la couverture. La combinaison format/organisation doit être prise en charge ; consulter [les formats](formats.fr.md).

Les paquets contiennent `manifest.json` et les fichiers de données. La vérification contrôle leur intégrité. Conservez le manifeste avec les fichiers partagés. Gzip compresse chaque fichier dans le répertoire ; le lecteur le décompresse. Avec ZIP, la sortie contient un manifeste externe et `package.zip` ; l'archive contient les fichiers et un manifeste interne. Vérifiez le répertoire initial pour l'intégrité de l'archive, puis extrayez `package.zip` dans un **nouveau répertoire** et vérifiez/importez ce répertoire extrait. La compression constitue un transport, pas un nouveau contrat de données.

## Utiliser des fichiers GeoNames réels

Téléchargez les fichiers souhaités depuis [les exports GeoNames](https://download.geonames.org/export/dump/), conservez leur licence et extrayez vous-même les archives ZIP. Importez ensuite les fichiers texte locaux :

```sh
node dist/cli.js geonames --countries data/countryInfo.txt --admin1 data/admin1CodesASCII.txt --admin2 data/admin2Codes.txt --places data/cities1000.txt --version geonames-2026-11-11 --output data/geonames.sqlite
```

Seuls `--countries`, `--version` et `--output` sont obligatoires. L'importeur ne télécharge rien sur le réseau. Il accepte les lieux habités GeoNames, et non toutes les classes de points géographiques. Chaque fichier reçoit une révision de provenance SHA-256. Voir [la couverture et les limites](data-sources.fr.md).

## Amorcer PostgreSQL

Exportez du JSON, NDJSON ou CSV normalisé, puis examinez l'aperçu avant l'application :

```sh
node dist/cli.js export --snapshot data/example.sqlite --format ndjson --coordinates --output exports/seed
node dist/cli.js seed --package exports/seed --create-schema
node dist/cli.js seed --package exports/seed --create-schema --apply
```

Définissez `DATABASE_URL` dans votre terminal ou gestionnaire de secrets avant ces commandes. N'enregistrez pas les identifiants de connexion dans des fichiers suivis ou dans les paquets exportés. Les commandes ci-dessus ciblent le schéma standard ; les tables applicatives existantes nécessitent un mapping explicite. Voir [l'amorçage](seeding.fr.md) pour l'ordre des révisions, les champs gérés et la reprise.

## SDK optionnel

Seules les applications qui souhaitent consulter un instantané via l'API locale doivent installer la bibliothèque. Après publication npm, utilisez `npm install georeference` ; avant publication, construisez et installez une archive locale avec `npm pack` puis `npm install /chemin/vers/georeference-1.0.0.tgz`. La génération de fichiers n'en a pas besoin.

```ts
import { Snapshot, createClient } from 'georeference';

const snapshot = Snapshot.open('data/example.sqlite');
try {
  const client = createClient(snapshot);
  console.log(client.getEntity('example:locality'));
  console.log(client.getCountry('example:country'));
} finally {
  snapshot.close();
}
```

Le SDK lit l'instantané local ; il ne synchronise pas une base applicative. Gardez l'instantané ouvert pendant les itérations et fermez-le après usage. Installez le paquet compilé avec `npm install georeference`, ou construisez/installez-le depuis ce dépôt.
