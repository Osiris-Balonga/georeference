# Formats pris en charge et limites

[English](formats.md) · [Accueil](../README.fr.md)

Tous les exports utilisent la même sélection d'entités de la République du Congo, leurs types administratifs `kind` et leurs IDs stables. Le manifeste précise version des données, provenance, options, ancêtres de contexte, références externes, couverture géométrique et sommes de contrôle. Voici les valeurs de `--format`. La révision Congo seul est prévue en 1.1.0 ; le paquet 1.0.0 déjà publié a un autre comportement de données par défaut.

`coverage.json` et `provenance.json` accompagnent les paquets comme métadonnées du manifeste (`role: 'metadata'`) ; ce ne sont pas des entités à amorcer. La couverture géographique reste explicitement partielle. Exporter tous les enregistrements sélectionnés de l'instantané, ancêtres compris, ne prouve pas l'exhaustivité du territoire. Voir [le référentiel Congo](congo-reference.fr.md).

Pour les usages, complexités, dépendances, limites et priorités de tous les formats évalués, consultez [les choix des formats](format-decisions.fr.md).

| Format | Usage en V1 | Organisation et géométries | Limites |
|---|---|---|---|
| `json` | Échange applicatif général | Entités plates ou `--layout hierarchical` ; coordonnées/frontières facultatives | Sortie hiérarchique limitée à 50 000 entités ; beaucoup de lecteurs chargent tout le document |
| `ndjson` | Pipelines par lots et entrée du seeder | Une entité plate par ligne ; coordonnées/frontières facultatives | Schéma/métadonnées dans le manifeste ; une grande géométrie reste un grand enregistrement |
| `csv` | Tableurs et échange tabulaire normalisé | Entités plates ; champs structurés en cellules JSON | Aucun typage intrinsèque ; importer les IDs comme texte dans un tableur ; pas d'arborescence |
| `sql-postgres` | Scripts pour le schéma standard PostgreSQL | `--schema-mode schema-and-data` ou `data-only` ; `--sql-mode upsert` ou `insert-only` | Spécifique PostgreSQL, pas du SQL MySQL/MariaDB/SQLite ; data-only exige la table standard compatible |
| `sqlite` | Base locale prête à interroger | Fichier autonome avec relations/index | Ce n'est ni GeoPackage ni SpatiaLite ; une géométrie JSON n'implique pas d'index spatial natif |
| `geojson` | Couches cartographiques de points et frontières | FeatureCollections distinctes pour points/frontières demandés | WGS84 `[longitude, latitude]` ; les frontières ne sont pas déduites des points |

Coordonnées et frontières sont indépendantes. Une géométrie absente ne devient ni `(0,0)` ni un polygone inventé. L'inclusion des ancêtres préserve par défaut l'intégrité relationnelle ; `--no-ancestors` déclare les dépendances externes.

Le profil machine CSV préserve les valeurs sources. `id`, `entityType`, `name` et `countryId` sont des chaînes ordinaires ; `kind` est une chaîne ordinaire, vide si absent ; `parentId` est une chaîne JSON ou `null`. Les champs facultatifs `codes`, `names`, `level`, `coordinates` et `boundary` sont des cellules JSON : cellule vide signifie absent, `null` littéral signifie null explicite. Les colonnes coordonnées/frontière sont omises si non demandées. `--spreadsheet-safe` est un profil de présentation explicite pour les cellules pouvant être interprétées comme formules ; cette sortie transformée ne sert pas d'échange machine sans perte.

Le mode de création SQL crée le schéma standard, avec `kind` nullable ; ce n'est pas un moteur de migration. `CREATE TABLE IF NOT EXISTS` ne rend pas une table existante compatible. Importer des données avec `kind` dans une ancienne table gérée exige une migration explicite de colonne ou un mapping vers une colonne existante compatible. Pour actualiser une base applicative, utilisez [le seeder](seeding.fr.md) et ses règles de champs gérés/révisions.

## Compression et reproduction

`--compression none`, `gzip` ou `zip` contrôle le transport. Les fichiers gzip sont lus directement. Une sortie ZIP contient `manifest.json` et `package.zip` ; l'archive contient son propre manifeste et les fichiers. Vérifiez le paquet externe pour l'intégrité de l'archive ; extrayez le ZIP dans un nouveau répertoire pour vérifier/importer les fichiers. Les exports terminés sont publiés après génération ; les destinations existantes sont refusées. Une annulation/erreur ne doit pas publier un paquet partiellement complet.

Conservez les artefacts publiés si les octets exacts comptent. La reproductibilité sémantique signifie qu'un même instantané et une même requête normalisée sélectionnent les mêmes valeurs/IDs ; les métadonnées binaires/compressées peuvent varier avec les versions des outils. Les sommes de contrôle vérifient l'artefact reçu, pas toute régénération future.

## Formats absents de la V1

SQL MySQL/MariaDB, scripts SQL SQLite, modules de données TypeScript, YAML, Parquet, GeoParquet, GeoPackage et Shapefile ne sont pas annoncés comme pris en charge. Des adaptateurs pourront les ajouter selon des besoins concrets. Un SDK TypeScript existe déjà ; il est distinct de l'export de données sous forme de code TypeScript.

GeoPackage exige les métadonnées et l'encodage géométrique OGC ; renommer un `.sqlite` ne suffit pas. GeoParquet nécessite un profil/version testé, pas simplement une colonne WKB. Shapefile restreint noms/types de champs et impose plusieurs fichiers : il répond à un besoin de compatibilité plutôt qu'au choix géographique par défaut.
