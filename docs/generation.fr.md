# Générer les fichiers du référentiel Congo

[English](generation.md) · [Couverture Congo](congo-reference.fr.md) · [Accueil](../README.fr.md)

Ce guide décrit la révision limitée au Congo prévue pour 1.1.0. Tant qu'elle n'est pas publiée, npm 1.0.0 conserve l'ancien fonctionnement. Utilisez un checkout de cette révision avec Node.js 24.18.x, `npm ci` et `npm run build` ; les exemples exécutent ce build local. Après livraison, `npx georeference` pourra remplacer `node dist/cli.js`.

## Données intégrées par défaut

```sh
node dist/cli.js
node dist/cli.js generate --format ndjson --compression gzip --output ./data/congo
node dist/cli.js departments --format csv --output ./data/congo-departments
node dist/cli.js communes --output ./data/congo-communes
```

Sans commande, la CLI génère le référentiel Congo intégré, pas un téléchargement de liste de pays. Le paquet JSON par défaut contient `entities.json`, `coverage.json`, `provenance.json` et `manifest.json` dans `./data/georeference/`. Le JSON suit `{ metadata, entities }` ; le lecteur JSON de votre application suffit. Aucune base n'est modifiée ni dépendance ajoutée au projet cible.

`--output` est un **nouveau répertoire**, pas un fichier. Les chemins existants sont refusés. Générez ailleurs puis examinez les changements avant de remplacer les données applicatives. Les six [formats](formats.fr.md) utilisent le même référentiel. Gzip/ZIP regroupent données et métadonnées ; conservez manifeste et couverture/provenance lors du partage.

## Sélectionner les types administratifs

| Commande | `kind` sélectionné |
|---|---|
| `countries` | `country` — uniquement la République du Congo |
| `departments` | `department` |
| `communes`, `cities` | `commune` (`cities` est un alias, pas tous les lieux habités) |
| `districts` | `district` |
| `arrondissements` | `arrondissement` |
| `neighborhoods` | `neighborhood` |
| `villages` | `village`, lorsqu'une observation nommée a été intégrée |
| `generate` | Toutes les entités sélectionnées |

`generate` et `export` avancé acceptent aussi `--kinds department,commune` (valeurs `kind` séparées par des virgules). Une commande sémantique comme `neighborhoods` fixe son propre type. `countries` reste compatible avec un instantané fourni limité au pays sans `kind`.

Les ancêtres nécessaires peuvent apparaître comme contexte : le nombre de lignes ne correspond pas nécessairement au seul nombre de quartiers sélectionnés. La couverture distingue effectifs du référentiel/de l'export et exhaustivité géographique.

```sh
node dist/cli.js arrondissements --city Brazzaville --output ./data/brazzaville-arrondissements
node dist/cli.js neighborhoods --city Brazzaville --arrondissement 2 --format csv --output ./data/bacongo-neighborhoods
node dist/cli.js neighborhoods --city Pointe-Noire --output ./data/pointe-noire-neighborhoods
```

`--city` résout un ID ou nom de commune enregistré. `--arrondissement` résout un ID/nom ; un numéro seul nécessite `--city`, car les numéros se répètent entre communes. Les filtres suivent les descendants vérifiés, pas la proximité ni la ressemblance des noms. La date d'observation reste valable après filtrage. Une entrée absente/ambiguë ne doit pas sélectionner silencieusement un autre parent.

Les filtres pays acceptent `CG`, `COG` ou l'ID Congo conservé `geonames:2260494`. Les autres pays sont refusés, dont `CD`/`COD` (République démocratique du Congo). Cette CLI ne propose pas de référentiel mondial.

## Géométries et entrées Congo personnalisées

Coordonnées et frontières restent indépendantes. Les demander ne crée pas de géométrie indisponible. GeoJSON peut contenir des géométries nulles ; consultez la couverture et [les limites](formats.fr.md).

Les utilisateurs avancés peuvent fournir `--snapshot ./sources/congo.sqlite` à la place du référentiel intégré. Il doit contenir uniquement des données CG. L'entrée historique `--source-file ./sources/countryInfo.txt` fournit seulement le pays Congo ; ce n'est pas une source de villes/quartiers. Les entrées personnalisées ont leur couverture partielle et n'héritent pas des observations intégrées.

Le référentiel par défaut n'exige pas de réseau. npm peut avoir besoin d'une connexion pour obtenir l'exécutable via `npx`. Aucun rafraîchissement géographique en arrière-plan ni repli silencieux sur une source amont. Conservez version du générateur et révision source pour reproduire un paquet.

Le [SDK optionnel](getting-started.fr.md#sdk-optionnel) sert aux applications souhaitant interroger un instantané local. La lecture des fichiers générés n'en dépend pas.
