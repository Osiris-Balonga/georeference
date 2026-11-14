# Formats, fichiers et tables métier

[English](formats.md) · [Accueil](../README.fr.md) · [Étude complète des formats](format-decisions.fr.md)

La CLI 1.2.1 exporte les données Congo sélectionnées sous forme de ressources, pas d'un mélange d'entités. Les UUID identifient les enregistrements applicatifs. Les listes montrent les noms par défaut. Tous les formats partagent une couverture partielle et datée ; aucun ne fournit les données géographiques manquantes.

## Fichiers et onglets

| Format | Sortie principale | Destinataire |
|---|---|---|
| `xlsx` | `congo.xlsx`, avec Informations et onglets par catégorie | Excel/tableurs compatibles |
| `csv` | Neuf fichiers par catégorie, même si une catégorie n'a que son en-tête | Consultation de listes |
| `json` | Neuf fichiers nommés, chacun contenant un tableau JSON indenté ; une catégorie vide vaut `[]` | Lecteurs JSON applicatifs |
| `ndjson` | Neuf fichiers nommés, un objet ressource par ligne | Traitement par lots/importeur de ressources |
| `sql-postgres` | `schema.sql` et `data.sql` ; data-only omet le schéma | PostgreSQL |
| `sqlite` | `congo.sqlite`, avec tables métier | Lecteurs SQLite |
| `geojson` | FeatureCollections de points/frontières demandées | Cartographie ; les géométries peuvent être nulles |

Chaque paquet contient aussi `README.txt` et `manifest.json`. Avec `--audit`, les détails `coverage.json` et `provenance.json` sont des métadonnées, jamais des lignes à amorcer.

Les CSV français se nomment `pays.csv`, `departements.csv`, `communes.csv`, `districts.csv`, `arrondissements.csv`, `communautes-urbaines.csv`, `communautes-rurales.csv`, `quartiers.csv` et `villages.csv`. XLSX contient les onglets Pays, Départements, Communes, Districts, Arrondissements, Communautés urbaines, Communautés rurales, Quartiers, Villages et Informations. `--language en` change les libellés humains ; il ne traduit pas les noms géographiques et ne change pas les UUID.

Un CSV contient une table par fichier et ne peut pas contenir d'onglets. Les noms des lieux parents remplacent les références brutes dans les listes. Une ligne de quartier peut ainsi afficher son nom, arrondissement, commune, département et pays. `--include-ids` ajoute les UUID si nécessaire. Ces listes et XLSX ne constituent pas des entrées de seeding sans perte. Un texte ressemblant à une formule doit rester du texte dans un tableur.

Les noms JSON/NDJSON applicatifs sont `countries`, `departments`, `communes`, `districts`, `arrondissements`, `urbanCommunities`, `ruralCommunities`, `neighborhoods` et `villages`, avec l'extension adaptée. Les lignes portent `id`, `name` et des relations explicites telles que `departmentId` ou `arrondissementId` ; aucun champ générique `kind`/`parentId` n'est à interpréter. Ces fichiers ne sont pas du MongoDB Extended JSON ni une migration MongoDB automatique ; l'application choisit explicitement collections et convention `_id`.

## Tables relationnelles

| Table SQL par défaut | Relations |
|---|---|
| `countries` | Codes ISO2/ISO3 |
| `departments` | `country_id` |
| `communes`, `districts` | `department_id` |
| `arrondissements` | `commune_id`, `number` municipal facultatif |
| `urban_communities`, `rural_communities` | `district_id` |
| `neighborhoods` | Un seul parent documenté parmi `commune_id`, `arrondissement_id`, `urban_community_id` |
| `villages` | Un seul parent documenté parmi `district_id`, `rural_community_id`, `urban_community_id` |

Chaque table possède une identité UUID et un nom. PostgreSQL utilise des clés primaires/étrangères UUID ; SQLite conserve des chaînes UUID. La géométrie est facultative, jamais déduite.

Fournissez les noms souhaités dans un JSON passé à `--sql-config` :

```json
{
  "schema": "public",
  "tables": {
    "communes": "cities",
    "neighborhoods": "quarters"
  }
}
```

Les noms non précisés gardent leur valeur par défaut. Les clés désignent les ressources ; les valeurs sont les tables. Les noms doivent être des identifiants valides et distincts. Ce choix renomme les objets générés de façon cohérente ; ce n'est ni un mapping de colonnes/clés locales ni une migration. SQLite n'accepte pas un schéma PostgreSQL personnalisé.

La génération PostgreSQL crée tables, index et clés étrangères sans supprimer les données existantes. `CREATE TABLE IF NOT EXISTS` ne rend pas une table existante compatible. `data.sql` utilise des upserts par UUID stable par défaut ; `--sql-mode insert-only` conserve les lignes existantes. Une ligne absente ne constitue jamais une instruction de suppression. Voir [l'import en base](seeding.fr.md).

## Compression et limites

`--compression none|gzip|zip` contrôle le paquet. ZIP comporte un manifeste interne : extrayez-le dans un nouveau dossier avant import. Vérifier l'intégrité contrôle les octets reçus, pas l'autorité de la source ni son exhaustivité. Un échec/une annulation ne doit pas publier une destination partielle.

Le parcours public exige les parents et refuse les anciens arbres d'entités mélangées. Un JSON texte peut être volumineux ; NDJSON convient au traitement par lots. Conservez révisions sources, version du générateur et artefacts finis pour reproduire les données. Les octets binaires peuvent varier entre outils malgré des UUID/valeurs identiques.

SQL MySQL/MariaDB, scripts SQL SQLite, modules TypeScript générés, YAML, Parquet, GeoParquet, GeoPackage et Shapefile restent des adaptateurs futurs étudiés, pas des sorties V1 annoncées. Une extension ne prouve pas la conformité à un standard. Voir [les décisions de formats](format-decisions.fr.md).
