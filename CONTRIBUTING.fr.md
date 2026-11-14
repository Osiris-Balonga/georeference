# Contribuer à 242Places

[English](CONTRIBUTING.md) · [Accueil](README.fr.md)

Les contributions doivent faciliter l'usage des données géographiques tout en préservant les identifiants, la provenance et les imports reproductibles. Pour un changement important, une nouvelle source ou un format, commencez par une issue afin de préciser le besoin et la cible de compatibilité.

## Installation locale

Utilisez Node.js 24.18.x et npm :

```sh
npm ci
npm run check
```

Cette vérification lance la validation TypeScript, les tests de comportement et la compilation. Les tests emploient des données fictives et des répertoires temporaires. Un test d'intégration PostgreSQL utilise `DATABASE_URL` lorsqu'elle est définie ; un test sauté ne prouve pas le fonctionnement du transport PostgreSQL. Ne pointez jamais des fixtures de tests destructives vers une base de production.

Le dépôt possède un workspace API privé à côté du paquet CLI/SDK public. Installez depuis la racine avec le verrou commun ; ne commitez pas de verrou API séparé. Pour travailler sur HTTP :

```sh
npm run dev:api
npm run typecheck:api
npm run test:api
```

Pour le serveur compilé, lancez `npm run build:api`, puis `npm run start:api`. Cette compilation inclut le cœur partagé. `npm run build` et la génération du paquet public restent des opérations CLI/SDK. Lancez `npm run test:acceptance` pour la parité API/sources/exports et l’isolation de la CLI empaquetée. Voir [l’utilisation de l’API](docs/api.fr.md) et [l’architecture](docs/architecture.fr.md).

## Branches et pull requests

- Créez une branche de tâche ciblée depuis `dev`, par exemple `feature/country-aliases`, `fix/csv-empty-values` ou `docs/import-guide`.
- Les pull requests de travail ciblent `dev`. Les pull requests de livraison vont du `dev` de ce dépôt vers `main`.
- Faites des commits cohérents et vérifiés selon Conventional Commits, par exemple `fix(csv): preserve absent optional fields`. Réunissez le comportement et ses tests ; ne commitez pas une étape volontairement rouge.
- Expliquez le problème observable, le nouveau comportement, l'impact de compatibilité et les vérifications réellement exécutées. Liez l'issue correspondante si elle existe.
- Les vérifications requises doivent passer sur la tête exacte de la pull request. Ne forcez pas les pushes, ne supprimez pas les branches protégées et ne contournez pas les revues/vérifications.

La protection repose sur les réglages du dépôt ; un fichier de workflow seul n'est pas une protection. Sa disponibilité et ses paramètres effectifs doivent être vérifiés lors de la configuration.

## Tests avant les changements de comportement

Écrivez un test ciblé depuis le comportement attendu ou le bug reproduit, exécutez-le et observez un échec significatif, puis implémentez et refactorisez avec les tests verts. Par exemple, un import doit démontrer qu'une seconde exécution ne modifie pas les lignes inchangées, plutôt que vérifier seulement l'appel d'un helper.

Les résultats attendus sont indépendants de l'implémentation. N'adaptez pas les attentes à un code erroné. Un échec d'import de module ne prouve que l'absence de structure ; les assertions doivent aussi distinguer un résultat concret incorrect. Documentation et fichiers statiques utilisent des vérifications directes plutôt que des tests artificiels.

Pour un adaptateur, couvrez IDs stables, noms non ASCII, distinction absence/null, options refusées, lisibilité de la sortie, annulation et pertes éventuelles. Les changements en base demandent une validation sémantique sur un moteur réel et un parcours d'intégration PostgreSQL. Toute dépendance d'exécution doit avoir une utilité concrète et une licence/maintenance vérifiées.

Pour l’API, conservez les règles géographiques dans le catalogue partagé et ses requêtes. Testez la frontière HTTP avec le lanceur Node existant et `app.inject()` ; conservez une couverture du démarrage/arrêt d’un vrai serveur. Couvrez rattachements directs/descendants des quartiers, distinction entre IDs typés invalides/introuvables, listes vides partielles, pagination, cache conditionnel et limites de requêtes. Les schémas HTTP doivent correspondre aux ressources documentées et ne pas exposer les audits internes. Vérifiez que dépendances et code API n’entrent pas dans le paquet CLI public, puis comparez les UUID API/sources/exports lors d’un changement de projection.

## Documentation publique et exemples

Actualisez les guides anglais/français correspondants dans la même pull request. Code, champs d'API, options CLI et titres de commits restent anglais. Gardez les exemples exécutables et indiquez clairement les données fictives. N'annoncez pas un format ou une version de moteur non vérifié.

Séparez les licences du logiciel et des données. Enregistrez licences, attributions et révisions sources. Ne commitez ni identifiants de connexion, téléchargements de données, exports de production, bases locales, builds générés, ni données personnelles. Les plans, prompts, rapports et transmissions privés d'agents n'appartiennent pas à ce dépôt.

## Avant de demander une revue

Examinez le diff indexé complet, lancez les vérifications adaptées et retirez les modifications sans lien. Signalez honnêtement les limites et vérifications sautées ou impossibles. Pour une vulnérabilité, suivez [SECURITY.fr.md](SECURITY.fr.md) plutôt que publier les détails d'exploitation dans une issue publique.
