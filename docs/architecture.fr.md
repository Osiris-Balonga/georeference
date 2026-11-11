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

Ajouter un format consiste à implémenter ce contrat, l'enregistrer et écrire des tests de comportement/compatibilité de lecture. Les filtres géographiques et l'attribution des IDs restent dans le cœur. La fonction `registerExportAdapter(adapter)` de la bibliothèque accepte un nom de format personnalisé pour le processus courant ; les doublons et le remplacement des formats intégrés sont refusés. La CLI énumère les formats intégrés ; les writers personnalisés sont enregistrés par le code applicatif. Les formats existants ne nécessitent pas de lourdes dépendances SIG natives.

## Enregistrer un writer personnalisé

Cet exemple applicatif exporte un ID stable par ligne et refuse les demandes d'arborescence ou de géométrie, car ce format contient volontairement les IDs seuls :

```ts
import { open } from 'node:fs/promises';
import { join } from 'node:path';
import { Snapshot, exportSnapshot, registerExportAdapter } from 'georeference';

registerExportAdapter({
  format: 'entity-ids',
  version: '1.0.0',
  validate(request) {
    if (request.layout === 'hierarchical' || request.coordinates || request.boundaries) {
      throw new Error('entity-ids supports flat IDs without geometry');
    }
  },
  async write({ plan, directory, signal }) {
    const file = await open(join(directory, 'ids.txt'), 'wx');
    try {
      for (const entity of plan.entities()) {
        signal?.throwIfAborted();
        await file.write(entity.id + '\n');
      }
    } finally {
      await file.close();
    }
    return ['ids.txt'];
  },
});

const snapshot = Snapshot.open('data/example.sqlite');
try {
  await exportSnapshot(snapshot, 'exports/entity-ids', { format: 'entity-ids' });
} finally {
  snapshot.close();
}
```

Renvoyez les noms relatifs après fermeture des ressources. Le coordinateur fournit aussi au format personnalisé le manifeste, les vérifications d'intégrité, la compression, l'annulation et la publication atomique. Un format personnalisé ne devient pas automatiquement une entrée du seeder.

## Libérer les plans de sélection

`Snapshot.select()` renvoie un plan dont l'itérateur `entities()` peut être relu jusqu'à sa libération. Les utilisateurs de cette API doivent libérer les ressources temporaires après usage :

```ts
import { Snapshot } from 'georeference';

const snapshot = Snapshot.open('data/example.sqlite');
try {
  const plan = snapshot.select({ countries: ['XZ'] });
  try {
    for (const entity of plan.entities()) console.log(entity.id);
  } finally {
    plan.dispose?.();
  }
} finally {
  snapshot.close();
}
```

Gardez l'instantané ouvert pendant l'utilisation du plan. Le coordinateur d'export et le SDK libèrent automatiquement leurs propres plans ; les appels directs à `select()` impliquent de gérer ce cycle de vie.

## Gestion des ressources

Les instantanés utilisent SQLite au lieu de relire entièrement la source pour chaque export. Les itérateurs permettent une écriture progressive des formats plats ; les sorties hiérarchiques et certains imports nécessitent une matérialisation bornée. Un seul polygone peut rester volumineux. Annulation, nettoyage et publication atomique appartiennent au coordinateur ; l'application qui utilise la bibliothèque fixe l'ordonnancement et les limites de stockage.

La V1 n'inclut ni file de jobs hébergée, ni tableau de bord, ni service distant de SDK, ni moteur universel de réconciliation des sources. Ces services pourront envelopper la bibliothèque sans changer le contrat des entités. Une API progressive ne constitue pas une garantie de capacité : mesurez le jeu de données, le writer, la concurrence et le déploiement.

## Versions distinctes

Version du jeu de données, du contrat, de l'adaptateur et du paquet ont des sens différents. Les révisions sources et empreintes rendent la provenance visible. Une même sélection logique doit préserver valeurs et IDs ; la régénération binaire identique entre bibliothèques/outils de compression différents constitue une garantie séparée.
