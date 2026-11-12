# Importer les ressources dans PostgreSQL

[English](seeding.md) · [Accueil](../README.fr.md) · [Tables](formats.fr.md#tables-relationnelles)

Générer des fichiers, appliquer des changements en base et lire via le SDK optionnel sont des opérations distinctes. La CLI publique 1.1.0 importe les ressources Congo dans des tables métier séparées. Elle n'exécute pas un SQL téléchargé arbitraire et ne déduit pas le schéma existant d'une application.

## Prévisualiser, puis appliquer

Générez un paquet de ressources JSON ou NDJSON et définissez `DATABASE_URL` hors des fichiers suivis :

```sh
npx georeference@1.1.0 generate --format ndjson --output ./exports/congo-seed
npx georeference@1.1.0 seed --package ./exports/congo-seed --create-schema
npx georeference@1.1.0 seed --package ./exports/congo-seed --create-schema --apply
```

Sans `--apply`, l'importeur présente seulement les changements prévus. `--create-schema` autorise la création des tables métier configurées lors de l'application ; il n'ajoute pas silencieusement des colonnes à des tables incompatibles. CSV/XLSX humains, GeoJSON, scripts SQL et exports SQLite ne sont pas des entrées du seeder. Les fichiers de métadonnées/audit ne deviennent jamais des lieux.

Utilisez `--sql-config FILE` avec la même configuration de noms que pour l'export SQL :

```json
{
  "schema": "public",
  "tables": {
    "communes": "cities",
    "neighborhoods": "quarters"
  }
}
```

```sh
npx georeference@1.1.0 seed --package ./exports/congo-seed --sql-config ./sql-names.json --create-schema
npx georeference@1.1.0 seed --package ./exports/congo-seed --sql-config ./sql-names.json --create-schema --apply
```

Les noms changent de façon cohérente les tables et références de clés étrangères générées. Ils ne mappent pas des colonnes ou clés primaires locales arbitraires. Examinez configuration et aperçu avant application dans une base applicative.

## Actualisations et transactions

- Les UUID identifient les lignes correspondantes. Le mode par défaut `--mode upsert` crée les ressources absentes et peut actualiser les valeurs sources fournies.
- Rejouer un contenu identique ne doit créer ni doublons ni mises à jour artificielles. Les UUID ne sont pas régénérés à chaque import.
- `--mode insert-only` conserve les lignes ayant déjà le même UUID.
- Une ressource absente n'implique jamais une suppression. Un export géographique partiel ne demande pas de retirer les données applicatives absentes.
- Les parents nécessaires doivent être inclus et les relations valides. Un quartier peut relever directement d'une commune, d'un arrondissement ou d'une communauté urbaine.
- L'application utilise une transaction et une session PostgreSQL dédiée avec verrou d'import. Un échec annule la transaction ; le nouveau parcours métier ne promet pas l'ancien protocole de lots/checkpoints.

Créer un schéma est distinct d'une migration. Une table `cities` existante avec identifiants locaux entiers ne devient pas compatible en configurant son nom. Préparez une migration/intégration examinée ou un schéma séparé compatible ; ne remplacez pas automatiquement les clés applicatives. Actualiser les valeurs gérées ne réconcilie pas automatiquement des modifications locales.

La commande métier accepte `--package`, `--apply`, `--create-schema`, `--mode` et `--sql-config`. Les anciens paramètres mono-table `--mapping`, `--table`, lots/révisions/checkpoints ne sont pas interprétés silencieusement dans ce parcours. Le seeder canonique bas niveau reste un composant de compatibilité, pas le contrat de ces nouveaux paquets.

## Les fichiers SQL constituent une autre livraison

`sql-postgres` génère `schema.sql` et `data.sql`. Examinez/appliquez le schéma avant les données avec vos outils PostgreSQL. `--schema-mode data-only` suppose des tables compatibles préexistantes. Générer les scripts ne connecte jamais une base.

Les scripts PostgreSQL ne constituent pas un SQL universel. MySQL/MariaDB et scripts SQL SQLite ne sont pas pris en charge ici. La base SQLite prête à consulter est un artefact distinct. Une somme de contrôle prouve l'intégrité, pas la justesse géographique ni la confiance dans l'expéditeur. Consultez les résultats CI réels pour la validation des moteurs et [la migration](migration.fr.md) avant de remplacer les anciens exports.
