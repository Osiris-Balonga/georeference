# Déployer l’API et la documentation

[English](deployment.md) · [Accueil](../README.fr.md)

Le site public, la [documentation](https://two42places.onrender.com/docs) et l’API partagent une origine publique. La passerelle Next.js sert le site à la racine ; les données utilisent `/v1/...` ; Fastify conserve `/docs` et `/openapi.json`. Le paquet npm reste le CLI autonome et le SDK optionnel, pas la distribution du serveur.

## Configuration Render

Utilisez la racine du dépôt comme dossier de compilation, un service web Node et Node.js `24.18.0` :

| Réglage | Valeur |
|---|---|
| Compilation | `npm ci --include=dev && npm run build:site` |
| Démarrage | `npm run start:site` |
| Sonde de disponibilité | `/health/ready` |
| `NODE_VERSION` | `24.18.0` |
| `NODE_ENV` | `production` |
| `API_HOST` | `0.0.0.0` |
| `PORT` | Fourni par Render |

Le référentiel est inclus dans Git : aucune base, disque, récupération à l’exécution ou variable secrète privée n’est nécessaire. Les dépendances de développement servent à compiler le cœur, l’API et le web. Le superviseur Node transmet les signaux d’arrêt à Fastify et Next.js.

Le service de production suit `main` et se déploie automatiquement uniquement après le succès des contrôles CI. Les PR de tâche ciblent `dev` ; les livraisons revues vont de `dev` à `main`. Appliquer les commandes du site combiné est un changement distinct de configuration de livraison. Conservez les protections du dépôt. Un service web gratuit peut se mettre en veille ; la première requête peut prendre plus de temps.

Vérifiez un déploiement terminé à l’état `live`, les redirections de racine/langue, une vraie réponse `/v1/congo`, `/v1/dataset`, les deux langues de documentation et `/health/ready`. La création du service ou l’acceptation du déclenchement ne prouve pas sa disponibilité.

Ces réglages du site combiné sont à appliquer lors de la livraison de cette branche. Le service actuellement déployé peut encore employer les commandes API seules. Voir [le guide du site](website.fr.md) pour le port interne, l’arrêt coordonné, l’origine du proxy à la compilation et la limite de débit agrégée. La racine devient le frontend public ; /docs et /v1 restent accessibles.
