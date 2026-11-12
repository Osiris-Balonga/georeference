# Générer les fichiers dans votre projet

[English](generation.md) · [Accueil](../README.fr.md)

Utilisez Node.js 24.18.x et npm. Exécutez l'outil une fois depuis le projet cible. Pour utiliser une version locale, construisez le dépôt puis remplacez `npx georeference` par `node /chemin/vers/georeference/dist/cli.js`.

```sh
npx georeference
npx georeference countries --country FR,CG --format csv --output ./data/countries
npx georeference countries --format sqlite --output ./data/countries-db
npx georeference countries --source-file ./sources/countryInfo.txt --output ./data/offline
```

Sans commande, l'outil génère les pays : téléchargement HTTPS de `countryInfo.txt` depuis GeoNames, puis création de `./data/georeference/entities.json` et `manifest.json`. Le JSON contient `{ metadata, entities }` ; utilisez le lecteur JSON de votre application. `npx` met en cache l'exécutable et ses dépendances hors du projet. Votre `package.json`, votre fichier de verrouillage et les dépendances restent intacts. Les fichiers générés ne nécessitent aucune installation de GeoReference à l'exécution.

`--output` désigne un **nouveau dossier**, pas un nom de fichier. Les destinations existantes sont refusées, y compris lors d'une seconde génération. Générez dans un autre dossier puis examinez/remplacez vous-même les données applicatives. La génération n'amorce jamais une base. Les six [formats d'export](formats.fr.md) sont disponibles ; CSV utilise le profil machine documenté. Conservez le manifeste avec les données pour l'attribution, les versions et les empreintes.

La source par défaut fournit les noms de pays, codes et IDs stables, sans coordonnées ni frontières. Pour des données enrichies, utilisez un instantané existant :

```sh
npx georeference generate --snapshot ./sources/world.sqlite --types locality --country CG --coordinates --format ndjson --output ./data/places
npx georeference countries --snapshot ./sources/world.sqlite --boundaries --format geojson --output ./data/borders
```

`countries` sélectionne uniquement les pays ; `generate` accepte les filtres de type/subdivision sur l'instantané. Sans instantané, les deux utilisent countryInfo. GeoJSON exige les options de géométrie et conserve les géométries indisponibles à null. Une base SQLite exportée diffère d'un instantané interne ; voir [les formats](formats.fr.md).

Les téléchargements sont limités à 30 secondes et la source à 2 Mio. Une erreur de connexion fait échouer la génération ; `--source-file` utilise un fichier GeoNames conservé hors ligne. Aucun repli silencieux sur d'anciennes données, ni cache persistant des données. Les versions dérivent du SHA-256 de la source : des octets amont modifiés donnent une nouvelle version. Conservez le fichier source et la version du générateur pour reproduire la sortie. Les téléchargements/instantanés temporaires sont nettoyés après succès ou échec. Métadonnées/manifestes conservent l'attribution GeoNames et CC BY 4.0 ; préservez-les lors de la redistribution. Voir [les sources](data-sources.fr.md).

Le [SDK](getting-started.fr.md#sdk-optionnel) est optionnel pour consulter un instantané local depuis une application. La génération de fichiers n'en a pas besoin.
