# Architecture, API et adaptateurs

[English](architecture.md) · [Accueil](../README.fr.md)

```text
Faits Congo datés + registre UUID persistant
                    ↓
Instantané interne validé et sélection géographique
                    ↓
Ressources métier publiques et relations explicites
                    ↓
        adaptateurs propres aux sorties
        ├─ noms et lieux parents → CSV / XLSX
        ├─ collections de ressources UUID → JSON / NDJSON
        ├─ schéma/données relationnels configurables → PostgreSQL / SQLite
        └─ géométries fournies → GeoJSON
                    ↓
README + audit facultatif + compression + manifeste d'intégrité

Paquet de ressources vérifié → aperçu/application → tables métier PostgreSQL
Ressources métier → catalogue indexé en lecture seule → API Fastify / SDK optionnel
```

Le modèle public sépare pays, départements, communes, districts, arrondissements, communautés, quartiers et villages. Il conserve les rattachements variables documentés. Un département et sa commune homonyme sont distincts ; le modèle n'impose pas d'arrondissement lorsqu'une source établit un parent communal direct.

## Identité stable et représentations

Un registre versionné attribue les UUID une seule fois. Noms et codes sources ne sont pas recalculés en nouveaux identifiants à chaque export. Ressources destinées à l'API, JSON et bases partagent les mêmes UUID logiques. Les listes utilisent les noms et masquent les IDs par défaut. Les identifiants sources restent une provenance, pas des clés primaires publiques.

`toResourceTables` projette les entités internes validées en tables de ressources typées. `exportResources` est le parcours public d'export ; `readResourcePackage` valide les paquets pris en charge et leur identité. Instantanés canoniques, anciens adaptateurs et seeder restent des composants de compatibilité. Leur mélange générique d'entités n'est plus la sortie par défaut de la CLI ni le contrat public de ressources.

Le dépôt source contient une application API Fastify dans un workspace npm privé, alimentée par ces ressources. La CLI publiée `242places@1.2.1` continue de générer des fichiers autonomes ; elle ne démarre pas l’API. Requêtes HTTP, fichiers générés et SDK installé optionnel sont des choix de consommation distincts. L’import en base reste une écriture explicite. Voir [le guide API](api.fr.md) pour le lancement local et le contrat HTTP ; aucune adresse publique d’hébergement n’est implicite.

## Cœur partagé et application HTTP privée

```text
reference/
  congo.json                  faits datés et preuves
  identities.json             registre UUID persistant
src/
  cli.ts                      commande de génération autonome
  client.ts                   SDK local optionnel
  domain/
    types.ts                  types précis des ressources géographiques
    model.ts                  conversion et validation d’intégrité
    catalog.ts                catalogue validé en lecture seule et index
    query.ts                  recherche, pagination et relations
    export.ts                 coordinateur d’exports existant
    ...                       composants de bases et formats
apps/api/
  package.json                workspace HTTP privé et dépendances
  src/
    app.ts                    construction de l’application, sans écoute réseau
    server.ts                 configuration, démarrage et branchement de l’arrêt
    config.ts                 configuration d’environnement validée
    shutdown.ts               arrêt borné déclenché par les signaux
    plugins/                  sécurité, erreurs et OpenAPI
    schemas/                  schémas HTTP de ressources et d’enveloppes
    routes/                   administration, lieux, référentiel et disponibilité
    http/cache.ts             cache HTTP conditionnel
  tests/                      comportements HTTP et cycle de vie du serveur
tests/                        cœur partagé et tests CLI/import existants
```

Un seul verrou npm à la racine installe le paquet public du cœur et le workspace API privé. Fastify, TypeBox et les plugins HTTP appartiennent au paquet API, pas aux dépendances de production de la CLI. Compiler le cœur et produire le paquet public restent indépendants de la compilation API. La compilation API construit d’abord le cœur partagé. Cette frontière est vérifiée avec la CLI empaquetée ainsi qu’avec les tests du dépôt.

Le domaine possède les règles géographiques. `catalog.ts` construit une vue indexée et validée du référentiel ; `query.ts` implémente recherche déterministe, bornes et relations directes/descendantes. Les routes traduisent une requête HTTP validée en consultation et retournent l’enveloppe publique. Elles ne réimplémentent pas les rattachements et ne lisent pas les fichiers à chaque requête.

Le serveur charge et valide le référentiel Congo fourni une seule fois avant d’accepter le trafic. Le jeu actuel tient en mémoire. Les requêtes utilisent cette version immuable jusqu’à son remplacement lors d’une nouvelle livraison du service ; consulter ne nécessite ni serveur de base, ni rafraîchissement mutable, ni téléchargement distant. Un catalogue adossé à une base pourra être envisagé lorsque des écritures, une administration ou des traitements spatiaux plus importants le justifieront.

## Frontières HTTP

`buildApp` construit Fastify séparément du serveur d’écoute afin que les tests injectent des requêtes sans ouvrir de port. Les schémas TypeBox définissent validation des paramètres, sérialisation des réponses, inférence TypeScript et documentation OpenAPI. La validation d’intégrité des sources/données reste indépendante de HTTP dans le cœur. Les schémas de réponse exposent des champs métier nommés plutôt que les preuves internes.

Les listes sont bornées et paginées. Les détails et relations vérifient les UUID dans leur catégorie. Un quartier peut dépendre directement d’une commune ou passer par un arrondissement ; la route des quartiers d’une commune retrouve les vrais descendants sans modifier leur parent direct enregistré. L’API distingue commune et département homonymes. Les listes vides décrivent les données connues, pas l’absence géographique.

Les réponses de données réussies portent les métadonnées de version/couverture et un cache conditionnel. Erreurs et sondes de disponibilité ne sont pas mises en cache. L’accès public depuis un navigateur ne requiert pas d’identifiants ; limitation par processus, confiance explicite dans les proxys, erreurs maîtrisées et journaux structurés limités bornent l’interface HTTP. Disponibilité, état prêt et arrêt propre permettent un service Node ordinaire. Les réglages de déploiement et la terminaison HTTPS seront adaptés à l’hébergeur réel.

Le contrat `/v1`, la version du logiciel API et `datasetVersion` sont distincts. Le service expose le référentiel déployé et n’annonce pas l’hébergement de tous les anciens jeux. Les réponses de lieux restent courtes ; les routes de référentiel et couverture portent les explications. Les anomalies sources ne deviennent pas des lieux sélectionnables et les coordonnées/frontières manquantes ne sont pas déduites.

La génération d’exports HTTP n’appartient pas à ce service de consultation. La CLI existante gère les formats personnalisés et l’importeur les écritures en base. Si des téléchargements sont ajoutés ensuite, préparez des fichiers versionnés avec le coordinateur existant et servez ces fichiers bornés plutôt que lancer des exports synchrones arbitraires à chaque requête.

## Vérification

Les tests du catalogue partagé couvrent identités, parents typés, recherche, pagination et sélection directe/descendante. Les tests API couvrent le parcours commune/arrondissement/quartier, les refus de requêtes, la distinction vide/introuvable, les enveloppes, le cache, les limites et la documentation. Une vérification sur un vrai serveur couvre démarrage et cycle de vie. Les tests d’exports/imports existants sont conservés ; les contrôles de parité API/exports/sources protègent les UUID. Un changement de comportement commence par un test significatif en échec ; la documentation utilise des vérifications directes de commandes/liens. Voir [les contributions](../CONTRIBUTING.fr.md).

## Ajouter un format

Conservez identifiants, sélection et règles de parents dans le modèle partagé. Un writer gère sérialisation, noms et pertes de représentation. Le coordinateur gère sortie temporaire, sécurité des fichiers, sommes de contrôle, compression et publication du dossier terminé. Les libellés/relations lisibles appartiennent aux adaptateurs de présentation ; échappement SQL et contraintes aux adaptateurs de base.

Un nouveau format exige des tests de lecture/interopérabilité et le refus clair des options incompatibles. Son ajout n'introduit pas de règle géographique dans son writer. Le contrat bas niveau `ExportAdapter`/`registerExportAdapter` est conservé pour la compatibilité canonique ; s'y enregistrer n'ajoute pas à lui seul un format métier à la CLI. Les formats publics intégrés sont explicites et documentés.

Enregistrez un writer métier avec `registerResourceAdapter({ format, version, validate, write })`. Sa fonction `write(tables, context)` reçoit les ressources validées et retourne des noms de fichiers relatifs ; `exportResources` gère le paquet sans modification du coordinateur. L'enregistrement reste local au processus SDK et n'installe pas automatiquement un plugin CLI. Les noms intégrés ne peuvent pas être remplacés.

L'adaptateur XLSX crée les parties SpreadsheetML avec la dépendance ZIP existante, des dates d'archive fixes et des cellules textuelles littérales. ExcelJS 4.4.0 (MIT) sert uniquement de lecteur indépendant dans les tests de développement. Son utilitaire UUID est fixé à 11.1.1 pour corriger l'avis affectant cette ancienne dépendance de test. ExcelJS n'est pas distribué comme dépendance d'exécution de la CLI ; le registre d'identités utilise indépendamment le générateur UUID de Node.

## Importer est distinct d'exporter

L'importeur gère politique d'écriture, compatibilité, transactions et concurrence. Il consomme du JSON/NDJSON de ressources vérifié, pas la présentation humaine CSV/XLSX. Génération du schéma, application d'une migration et import d'un jeu de données sont distincts. Le parcours public métier n'est pas un mappeur arbitraire d'ORM/clés locales.

Les paquets portent un résumé lisible de couverture. L'audit détaillé est facultatif et possède un rôle de métadonnée ; il ne devient jamais des lieux applicatifs. Vérifier l'intégrité ne certifie pas un inventaire géographique complet/actuel. Voir [la couverture](congo-reference.fr.md), [les formats](formats.fr.md) et [la migration](migration.fr.md).
