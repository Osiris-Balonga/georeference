# Import et amorçage PostgreSQL

[English](seeding.md) · [Accueil](../README.fr.md)

## Aperçu puis application

Le seeder lit des paquets GeoReference normalisés et vérifiés, pas du SQL téléchargé arbitrairement. Utilisez JSON, NDJSON ou le profil machine CSV. Le CSV transformé pour tableur, les couches GeoJSON, les scripts SQL et les fichiers SQLite exportés ne constituent pas des entrées interchangeables pour le seeder. Les imports V1 sont bornés à 128 Mio décompressés et 500 000 entités ; scindez les plus grands jeux en paquets géographiques mesurés. Gzip est lu directement ; ZIP doit être extrait avec son manifeste interne dans un nouveau répertoire.

Définissez `DATABASE_URL` hors des fichiers suivis. Pour la table GeoReference standard :

```sh
node dist/cli.js seed --package exports/seed --create-schema
node dist/cli.js seed --package exports/seed --create-schema --apply
```

Sans `--apply`, la commande produit un plan en lecture seule. `--create-schema` permet de créer les objets standards lors de l'application ; cela n'autorise pas à modifier arbitrairement les schémas existants. La cible par défaut est `public.georeference_entities`.

## Mises à jour et identité stable

- `--mode upsert`, par défaut, crée les lignes manquantes et actualise les champs gérés réellement présents. La source est prioritaire pour ces champs ; examinez cette politique si vous avez modifié localement le référentiel.
- Les champs facultatifs absents sont préservés. Coordonnées/frontières ne sont gérées que si le paquet les demandait. Un null explicite n'a pas le même sens qu'un champ absent.
- `--mode insert-only` ajoute les nouvelles entités, ignore les modifications des lignes existantes et signale les conflits. Aucun de ces modes ne supprime une entité absente du paquet.
- Rejouer le même contenu laisse les lignes inchangées intactes, sans doublons ni mises à jour artificielles simplement parce qu'un nouvel import est lancé.
- Les relations se résolvent par identité stable ; les parents nécessaires doivent être présents dans le paquet ou dans la cible. Un parent externe doit être un pays/une subdivision compatible, jamais une localité. Un export géographique partiel ne prouve jamais qu'une entité absente doit être supprimée.
- En insert-only, les nouveaux enfants sont validés contre les parents réellement conservés en cible lorsque leurs mises à jour sont ignorées. Un UPSERT partiel ne peut déplacer un parent vers un autre pays ou changer son type si des enfants conservés deviennent incohérents ; incluez le sous-arbre concerné dans la mise à jour.

Le seeder applique la priorité à la source pour les champs gérés. Fusion automatique des modifications locales, migrations, synchronisation destructive et mappings universels d'ORM restent hors V1.

## Ordonner explicitement les nouvelles révisions

Les versions de données sont opaques : `release-b` ne se compare pas de façon fiable à `2026.11`. Le premier import utilise la révision `0` par défaut. Un jeu/paquet modifié exige une révision entière explicite strictement supérieure :

```sh
node dist/cli.js seed --package exports/updated-seed --revision 1 --apply
```

Les révisions inférieures/égales en conflit sont refusées. `--allow-downgrade` constitue une dérogation explicite, pas une reprise par défaut. Conservez la même révision pour reprendre le même import interrompu.

## Préserver les clés applicatives existantes

Utilisez `--mapping path/to/mapping.json` pour mapper les champs canoniques vers les colonnes prises en charge de votre table. Exemple :

```json
{
  "schema": "public",
  "table": "places",
  "localIdColumn": "id",
  "columns": {
    "id": "georeference_id",
    "entityType": "entity_type",
    "countryId": "country_id",
    "parentId": "parent_id"
  }
}
```

Ici, `id` est une clé primaire entière serial/identity existante, et `georeference_id` l'identifiant stable sous forme de chaîne. Son unicité doit être imposée par une vraie clé primaire ou contrainte/index UNIQUE non partiel à une seule colonne ; une déclaration de mapping ou une clé unique composite ne suffit pas. Le seeder préserve les IDs locaux et les utilise pour les relations ; il ne remplace pas les clés de l'application. Les autres colonnes gérées doivent avoir des noms/types compatibles ou un mapping explicite. Préservez les champs métier et fournissez leurs valeurs par défaut obligatoires. Le mapping V1 couvre les clés entières serial/identity, pas tous les schémas personnalisés/composites.

## Transactions, reprise et visibilité

`--batch-size` borne chaque lot (`500` par défaut). Un lot et son curseur de reprise sont commités ensemble. Une erreur ultérieure peut laisser visibles des lots précédents ; l'import entier ne constitue pas une publication atomique. Relancez le même paquet avec les mêmes mapping, mode, révision et taille de lot pour reprendre. Un import terminé rejoué compare à nouveau les lignes et préserve les valeurs inchangées.

Un import interrompu doit se terminer avec les mêmes paquet, mapping, mode et taille de lot avant qu'un autre import commence sur cette cible. Ne changez pas de paquet ou de mapping pour contourner un curseur de reprise en attente.

Un verrou consultatif sérialise les imports vers la même cible. Les utilisateurs de la bibliothèque doivent fournir une **connexion/session dédiée**, pas un pool susceptible de changer de session entre les requêtes. La CLI ouvre un client PostgreSQL dédié. Un point de reprise n'est valable qu'après commit de sa transaction.

Manifestes et empreintes détectent corruption et fichiers manquants ; ils ne constituent pas une signature garantissant l'identité de l'émetteur. Examinez provenance et mapping, puis utilisez l'aperçu avant d'appliquer un paquet à une base existante.

## Périmètre de validation

Les tests exercent la sémantique PostgreSQL via PGlite et comprennent un test d'intégration `pg` activé par `DATABASE_URL`. La CI fournit un service PostgreSQL pour ce parcours. Un test de service sauté/non exécuté ne prouve pas la compatibilité d'une version serveur ; consultez le résultat CI exact de la révision utilisée.
