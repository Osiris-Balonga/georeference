# Passer au contrat d'export de ressources

[English](migration.md) · [Accueil](../README.fr.md) · [Formats](formats.fr.md)

La version 1.1.0 modifie volontairement les sorties publiques de npm 1.0.0 et des anciens exports de développement. Conservez fichiers/sauvegardes, générez dans un nouveau dossier et comparez avant remplacement.

| Ancienne sortie | Nouvelle sortie |
|---|---|
| `entities.json` / `entities.csv` mélangeant les catégories | Tableaux JSON séparés ou CSV humains par catégorie |
| Champs génériques `kind`, `parentId` | Ressources nommées et relations explicites |
| Identités sources `geonames:` / `cg:` | Identités UUID persistées |
| Table SQL unique `georeference_entities` | Tables métier séparées et configurables |
| Rapports volumineux de couverture/provenance par défaut | `README.txt` humain ; détail avec `--audit` |
| Anciens paramètres d'import mono-table | Importeur métier avec options limitées explicites |

Les faits restent datés et partiels. Changer de représentation n'ajoute pas les quartiers, villages ou géométries manquants.

## Préserver les identités pendant la migration

Le registre intégré `reference/identities.json` fait correspondre les anciennes identités aux UUID attribués une fois. Renommer un libellé doit conserver son UUID. Ne générez pas d'IDs aléatoires à chaque import et ne créez pas les associations à partir des noms seuls. Les départements/communes/districts homonymes restent distincts.

Une base existante nécessite une migration/correspondance examinée entre anciennes clés et UUID, y compris pour les données applicatives dépendantes. La configuration des noms SQL ne constitue pas cette migration. Exécuter les nouvelles données dans une ancienne table générique ou une table homonyme incompatible ne la convertit pas automatiquement.

## Actualiser les consommateurs

Chargez directement les tableaux par catégorie, comme `communes.json`, plutôt qu'une enveloppe `entities`. Remplacez les filtres génériques `parentId` par des champs explicites : `communeId` dans les arrondissements, `arrondissementId` dans les quartiers. Gérez aussi les quartiers rattachés directement à une commune/communauté urbaine.

Utilisez les paquets de ressources JSON/NDJSON pour l'import métier. CSV/XLSX restent des listes, même avec les UUID. Conservez manifeste et README avec les fichiers. L'audit détaillé reste une métadonnée, pas une collection supplémentaire à amorcer.

## Limites de compatibilité

Les API d'instantanés canoniques/anciens helpers restent des composants bas niveau de compatibilité. Ils ne rendent pas interchangeables anciens paquets et nouveaux fichiers publics. Une base SQLite métier exportée n'est pas un instantané canonique.

Le nouveau parcours exige des ressources UUID typées et leurs ancêtres. Il ne convertit pas silencieusement les enregistrements non typés, ne retire pas les parents et ne rétablit pas l'ancien arbre JSON mélangeant les catégories. Les données personnalisées nécessitent le contrat source et une migration explicite.

Aucune migration MongoDB automatique, aucun remapping arbitraire de clés locales ni aucune API HTTP ne sont inclus. Voir [l'import en base](seeding.fr.md) et [l'architecture](architecture.fr.md).
