# Architecture et adaptateurs

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
Ressources métier → SDK optionnel / futur contrat API
```

Le modèle public sépare pays, départements, communes, districts, arrondissements, communautés, quartiers et villages. Il conserve les rattachements variables documentés. Un département et sa commune homonyme sont distincts ; le modèle n'impose pas d'arrondissement lorsqu'une source établit un parent communal direct.

## Identité stable et représentations

Un registre versionné attribue les UUID une seule fois. Noms et codes sources ne sont pas recalculés en nouveaux identifiants à chaque export. Ressources destinées à l'API, JSON et bases partagent les mêmes UUID logiques. Les listes utilisent les noms et masquent les IDs par défaut. Les identifiants sources restent une provenance, pas des clés primaires publiques.

`toResourceTables` projette les entités internes validées en tables de ressources typées. `exportResources` est le parcours public d'export ; `readResourcePackage` valide les paquets pris en charge et leur identité. Instantanés canoniques, anciens adaptateurs et seeder restent des composants de compatibilité. Leur mélange générique d'entités n'est plus la sortie par défaut de la CLI ni le contrat public de ressources.

Ces ressources peuvent alimenter une future API HTTP ; cette révision n'implémente ni API hébergée, ni service de points d'accès, ni déploiement. Fichiers générés et SDK optionnel installé restent deux choix de consommation.

## Ajouter un format

Conservez identifiants, sélection et règles de parents dans le modèle partagé. Un writer gère sérialisation, noms et pertes de représentation. Le coordinateur gère sortie temporaire, sécurité des fichiers, sommes de contrôle, compression et publication du dossier terminé. Les libellés/relations lisibles appartiennent aux adaptateurs de présentation ; échappement SQL et contraintes aux adaptateurs de base.

Un nouveau format exige des tests de lecture/interopérabilité et le refus clair des options incompatibles. Son ajout n'introduit pas de règle géographique dans son writer. Le contrat bas niveau `ExportAdapter`/`registerExportAdapter` est conservé pour la compatibilité canonique ; s'y enregistrer n'ajoute pas à lui seul un format métier à la CLI. Les formats publics intégrés sont explicites et documentés.

Enregistrez un writer métier avec `registerResourceAdapter({ format, version, validate, write })`. Sa fonction `write(tables, context)` reçoit les ressources validées et retourne des noms de fichiers relatifs ; `exportResources` gère le paquet sans modification du coordinateur. L'enregistrement reste local au processus SDK et n'installe pas automatiquement un plugin CLI. Les noms intégrés ne peuvent pas être remplacés.

L'adaptateur XLSX crée les parties SpreadsheetML avec la dépendance ZIP existante, des dates d'archive fixes et des cellules textuelles littérales. ExcelJS 4.4.0 (MIT) sert uniquement de lecteur indépendant dans les tests de développement. Son utilitaire UUID est fixé à 11.1.1 pour corriger l'avis affectant cette ancienne dépendance de test. ExcelJS n'est pas distribué comme dépendance d'exécution de la CLI ; le registre d'identités utilise indépendamment le générateur UUID de Node.

## Importer est distinct d'exporter

L'importeur gère politique d'écriture, compatibilité, transactions et concurrence. Il consomme du JSON/NDJSON de ressources vérifié, pas la présentation humaine CSV/XLSX. Génération du schéma, application d'une migration et import d'un jeu de données sont distincts. Le parcours public métier n'est pas un mappeur arbitraire d'ORM/clés locales.

Les paquets portent un résumé lisible de couverture. L'audit détaillé est facultatif et possède un rôle de métadonnée ; il ne devient jamais des lieux applicatifs. Vérifier l'intégrité ne certifie pas un inventaire géographique complet/actuel. Voir [la couverture](congo-reference.fr.md), [les formats](formats.fr.md) et [la migration](migration.fr.md).
