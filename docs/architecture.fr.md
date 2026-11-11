# Architecture et adaptateurs

[English](architecture.md) · [Accueil](../README.fr.md)

```text
Entrée canonique / texte GeoNames
              ↓
        validation → instantané SQLite versionné
                              ↓
               sélection géographique + résolution des ancêtres
                              ↓
                    itérateur d'entités canoniques
                              ↓
                       adaptateur de format
                              ↓
                fichiers + compression + manifeste
                              ↓
                      paquet d'export vérifié

Paquet → validation → plan d'import → adaptateur PostgreSQL → base cible
Instantané local → SDK de lecture → recherches/itérations applicatives
```

Le contrat partagé se trouve dans `src/types.ts`. Le cœur possède les règles d'identifiants, d'intégrité du graphe, de sélection et de projection géométrique. Les adaptateurs possèdent l'encodage et la validation propres aux formats. Le coordinateur d'export gère les sorties temporaires, le packaging, les empreintes et la publication. Le seeder gère les mises à jour en base ; le SDK gère la consultation, pas la synchronisation d'une base applicative.

Le contrat `ExportAdapter` déclare `format`, `version`, `validate(request)` et `write(context)`. Le contexte contient l'itérateur canonique réutilisable, le plan résolu, le répertoire de sortie et un signal d'annulation facultatif. Le writer renvoie des noms de fichiers relatifs après fermeture de ses ressources. Il refuse les combinaisons non supportées avant génération et préserve les IDs stables.

Ajouter un format consiste à implémenter ce contrat, l'enregistrer et écrire des tests de comportement/compatibilité de lecture. Les filtres géographiques et l'attribution des IDs restent dans le cœur. L'enregistrement est statique en V1 ; aucun plugin arbitraire ni marketplace n'est exécuté. Les formats existants ne nécessitent pas de lourdes dépendances SIG natives.

## Gestion des ressources

Les instantanés utilisent SQLite au lieu de relire entièrement la source pour chaque export. Les itérateurs permettent une écriture progressive des formats plats ; les sorties hiérarchiques et certains imports nécessitent une matérialisation bornée. Un seul polygone peut rester volumineux. Annulation, nettoyage et publication atomique appartiennent au coordinateur ; l'application qui utilise la bibliothèque fixe l'ordonnancement et les limites de stockage.

La V1 n'inclut ni file de jobs hébergée, ni tableau de bord, ni service distant de SDK, ni moteur universel de réconciliation des sources. Ces services pourront envelopper la bibliothèque sans changer le contrat des entités. Une API progressive ne constitue pas une garantie de capacité : mesurez le jeu de données, le writer, la concurrence et le déploiement.

## Versions distinctes

Version du jeu de données, du contrat, de l'adaptateur et du paquet ont des sens différents. Les révisions sources et empreintes rendent la provenance visible. Une même sélection logique doit préserver valeurs et IDs ; la régénération binaire identique entre bibliothèques/outils de compression différents constitue une garantie séparée.
