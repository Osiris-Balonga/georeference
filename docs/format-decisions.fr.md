# Choix des formats

[English](format-decisions.md) · [Formats pris en charge](formats.fr.md) · [Accueil](../README.fr.md)

Décisions réexaminées le 12 novembre 2026.

Le produit concerne exclusivement la République du Congo. Ces choix d'encodage servent son référentiel vérifié et daté ; aucun format n'étend les pays couverts ni ne fournit les quartiers/géométries manquants. La correction Congo seul est prévue en 1.1.0 et ne décrit pas le comportement 1.0.0 déjà publié.

Cette comparaison explique le périmètre V1 et les besoins auxquels répondrait un autre adaptateur. **V1** désigne l'un des sept formats intégrés ; **ultérieur** signifie évalué mais non pris en charge par la CLI livrée. Les priorités suivantes dépendent d'une demande d'intégration concrète, sans engagement à développer tous les formats.

La complexité inclut génération et validation d'interopérabilité : **faible**, **moyenne** ou **élevée**, par rapport au contrat commun de ressources métier. Les dépendances des formats ultérieurs sont des catégories probables, pas des paquets installés ni des versions approuvées. Qualité, couverture et droits de redistribution restent des prérequis pour chaque format.

## Comparaison

| Format | Usages concrets | Pertinence pour GeoReference | Complexité de génération | Dépendances | Limites principales | Priorité |
|---|---|---|---|---|---|---|
| JSON | Ressources applicatives classées par catégorie | Très forte pour les intégrations | Faible | Sérialisation JSON native et flux | Tableaux indentés plus faciles à parcourir ; les gros fichiers restent coûteux en mémoire ; ancien arbre mélangé hors contrat public | **V1**, `json` |
| JSON Lines / NDJSON | Import de ressources par lots et lecture progressive | Très forte pour les pipelines | Faible | Sérialisation JSON native et flux | Un objet par ligne dans chaque catégorie ; métadonnées séparées ; une grande géométrie reste un grand enregistrement | **V1**, `ndjson` |
| XLSX | Listes avec onglets par catégorie, navigation et rattachements lisibles | Très forte pour le public humain | Moyenne | Writer de classeur XLSX et vérifications avec des lecteurs compatibles | Classeur multi-onglets, pas un paquet de seeding ; limites de feuilles/lignes et valeurs textuelles à vérifier | **V1**, `xlsx` |
| CSV | Listes lisibles dans les tableurs | Très forte pour l’accessibilité | Faible à moyenne | `csv-stringify` | Un fichier par catégorie, pas des onglets ; noms et lieux parents par défaut ; option UUID ; présentation distincte d’une entrée de seeding | **V1**, `csv` |
| SQL PostgreSQL | Initialisation de tables métier et scripts de données examinables | Forte pour les intégrations applicatives | Moyenne | Générateur SQL, PostgreSQL pour validation ; `pg` pour import connecté | Schéma/données séparés, tables configurables, clés UUID ; création distincte d’une migration ; PostgreSQL seul | **V1**, `sql-postgres` |
| SQL MySQL / MariaDB | Applications utilisant déjà ces moteurs | Forte lorsque les destinataires l'exigent | Moyenne à élevée | Profils/générateurs séparés et tests indépendants des moteurs | DDL, échappement, collations et expressions UPSERT varient selon moteur/version ; une histoire commune ne prouve pas la compatibilité | **Ultérieur**, selon la demande |
| Script SQL SQLite | Reconstruction textuelle examinable d'une base locale | Moyenne ; recoupe le fichier SQLite prêt à l'emploi | Moyenne | Générateur SQL SQLite ; moteur SQLite pour validation | Chargement texte encore nécessaire ; typage, limites de lots et activation des clés étrangères propres au moteur ; pas du SQL PostgreSQL | **Ultérieur**, sur besoin de script démontré |
| SQLite prêt à l'emploi | Applications hors ligne, requêtes locales, inspection de base | Très forte pour un artefact portable directement interrogeable | Moyenne | V1 utilise `node:sqlite` intégré | Nécessite finalisation/fermeture ; base relationnelle exportée distincte du contrat d'instantané interne ; SQLite ordinaire n'est pas GeoPackage | **V1**, `sqlite` |
| Modules de données TypeScript | Petites listes administratives du Congo et imports à la compilation côté frontend | Forte pour de petits sous-ensembles ; faible pour de grands ensembles géométriques | Faible à moyenne | Générateur de modules et validation par compilateur TypeScript | Coût de compilation/bundle ; types statiques sans validation des entrées arbitraires à l'exécution ; données en code distinctes d'un SDK | **Ultérieur** ; SDK de lecture déjà en V1 |
| YAML | Configuration modifiée à la main et petites fixtures lisibles | Faible à moyenne ; peu d'apport face à JSON pour le transport massif | Faible à moyenne | Sérialiseur YAML 1.2 | Citations de scalaires/choix du schéma influent sur les lecteurs ; peu adapté aux gros jeux ; préserver les IDs en chaînes | **Ultérieur**, selon un besoin de configuration |
| GeoJSON | Cartes web, inspection spatiale, échange de points/frontières | Très forte si les géométries sont disponibles et redistribuables | Moyenne | JSON natif et validation géométrique du cœur | Ordre WGS84 longitude/latitude ; frontières volumineuses ; couches points/frontières séparées ; géométrie absente conservée null | **V1**, `geojson` |
| Parquet | Analyse, entrepôts, lecture de colonnes choisies | Forte pour des traitements analytiques importants | Moyenne à élevée | Writer Parquet et codecs ; outils fondés sur Arrow possibles | Schéma binaire, dimensionnement des groupes de lignes, compatibilité lecteurs ; pas de clés étrangères imposées ; non lisible directement | **Ultérieur**, premier candidat analytique |
| GeoParquet | Analyse spatiale de grandes collections de points/frontières | Forte une fois un public d'analyse SIG identifié | Élevée | Writer Parquet/géospatial compatible et profil GeoParquet fixé | Typage/encodage, CRS, métadonnées et versions des lecteurs doivent s'accorder ; une colonne géométrique binaire seule ne suffit pas | **Ultérieur**, après le parcours Parquet |
| GeoPackage | Échange SIG bureautique, bases spatiales hors ligne, couches multiples | Forte pour les usages QGIS/SIG | Élevée | Writer conforme, souvent GDAL/OGR avec support SQLite | Métadonnées et encodage OGC requis ; renommer SQLite ne suffit pas ; règles de couches/géométries à valider | **Ultérieur**, préféré avant Shapefile pour les nouveaux parcours SIG |
| Shapefile livré en ZIP | Anciennes chaînes SIG imposant ce format | Faible par défaut ; forte pour un destinataire historique précis | Élevée | Writer SIG comme GDAL/OGR, support DBF/encodage, ZIP multifichier | Noms traditionnellement limités à 10 caractères, attributs limités, troncatures possibles ; viser au plus 2 Go par composant pour l'interopérabilité | **Ultérieur**, exigence de compatibilité explicite |

Références de format : [spécification NDJSON](https://github.com/ndjson/ndjson-spec), [CSV RFC 4180](https://www.rfc-editor.org/rfc/rfc4180), [modules TypeScript](https://www.typescriptlang.org/docs/handbook/2/modules.html), [YAML 1.2.2](https://yaml.org/spec/1.2.2/), [GeoJSON RFC 7946](https://www.rfc-editor.org/rfc/rfc7946), [Apache Parquet](https://parquet.apache.org/docs/), [spécification GeoParquet](https://geoparquet.org/), [GeoPackage OGC](https://www.ogc.org/standards/geopackage/) et [limites Shapefile GDAL](https://gdal.org/en/stable/drivers/vector/shapefile.html).

## Pourquoi PostgreSQL en premier

Un parcours d'import complet apporte davantage que plusieurs variantes SQL non vérifiées. PostgreSQL donne à la V1 une cible de conflit explicite avec `ON CONFLICT`, des mises à jour transactionnelles et un seul moteur à valider pour le schéma de tables métier configurables. Il s'agit d'un choix de périmètre, sans affirmer que les autres moteurs empêchent un amorçage fiable. Voir [INSERT PostgreSQL](https://www.postgresql.org/docs/current/sql-insert.html).

MySQL et MariaDB utilisent `ON DUPLICATE KEY UPDATE`, avec leurs règles de conflits de clés uniques et de valeurs entrantes. Un adaptateur devra fixer les moteurs/versions et tester séparément échappement, collations, DDL et mises à jour. SQLite nécessite aussi son profil SQL ; les clés étrangères doivent être activées explicitement par connexion. Références : [MySQL](https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html), [MariaDB](https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/inserting-loading-data/insert-on-duplicate-key-update), [clés étrangères SQLite](https://www.sqlite.org/foreignkeys.html).

## Fichiers, amorçage et SDK sont des choix distincts

| Besoin | Réponse V1 | Pourquoi le format seul ne suffit pas |
|---|---|---|
| Échanger ou archiver un instantané versionné | Adaptateur de fichiers, compression, manifeste, empreintes | Le destinataire a encore besoin d'un lecteur compatible et des licences sources |
| Initialiser/actualiser des tables applicatives compatibles | Importeur de ressources avec aperçu, relations UUID et transactions | Renommer des tables ne migre pas les colonnes incompatibles et ne mappe pas des clés locales arbitraires |
| Consulter des entités depuis une application | SDK de lecture sur instantané local | Un module de données TypeScript ne fournit pas à lui seul chargement/requêtes ou synchronisation d'une base |

Le [guide d'amorçage](seeding.fr.md) définit les garanties de mise à jour ; la [prise en main](getting-started.fr.md) montre le SDK. Ajouter un export SQL MySQL ne créerait pas automatiquement un seeder MySQL. Ajouter un export de modules TypeScript ne remplacerait pas le SDK.

## Étendre les formats

L'[architecture à adaptateurs](architecture.fr.md) ajoute un encodage sans déplacer sélection et IDs stables hors du cœur. Un adaptateur peut utiliser un stockage temporaire/à accès aléatoire si le streaming seul ne convient pas. Les dépendances géospatiales spécialisées restent facultatives pour le parcours léger existant.

Avant d'annoncer un format, identifiez destinataire/lecteur réel, versions testées, pertes déclarées, couverture géométrique, licences, limites de ressources et relecture indépendante. Pour GeoParquet, choisissez le profil d'interopérabilité selon les lecteurs visés sans supposer que la spécification la plus récente est partout disponible ; le site actuel comprend la version 2.0. La documentation du pilote Parquet GDAL décrit ses profils GeoParquet pris en charge. Références : [GeoParquet](https://geoparquet.org/), [pilote Parquet GDAL](https://gdal.org/en/stable/drivers/vector/parquet.html).

Pour un public SIG bureautique, GeoPackage peut précéder Parquet ; pour l'analyse en entrepôt, l'ordre peut s'inverser. Préservez l'ID stable GeoReference en attribut même si le format utilise son propre identifiant technique de ligne. Validez tables/encodage GeoPackage avec un lecteur conforme ; voir [le pilote GeoPackage GDAL](https://gdal.org/en/stable/drivers/vector/gpkg.html). Ces évaluations n'activent aucun format absent de la CLI V1 livrée.
