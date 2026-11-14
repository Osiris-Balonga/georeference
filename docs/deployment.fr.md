# Déployer l’API et la documentation

[English](deployment.md) · [Accueil](../README.fr.md)

La [documentation hébergée](https://two42places.onrender.com/) et l’API partagent un service web Fastify. `/` ouvre la documentation ; les données utilisent `/v1/...` ; `/openapi.json` expose le contrat. Le paquet npm reste le CLI autonome et le SDK optionnel, pas la distribution du serveur.

## Configuration Render

Utilisez la racine du dépôt comme dossier de compilation, un service web Node et Node.js `24.18.0` :

| Réglage | Valeur |
|---|---|
| Compilation | `npm ci --include=dev && npm run build:api` |
| Démarrage | `node apps/api/dist/server.js` |
| Sonde de disponibilité | `/health/ready` |
| `NODE_VERSION` | `24.18.0` |
| `NODE_ENV` | `production` |
| `API_HOST` | `0.0.0.0` |
| `PORT` | Fourni par Render |

Le référentiel est inclus dans Git : aucune base, disque, récupération à l’exécution ou variable secrète privée n’est nécessaire. Les dépendances de développement servent à compiler les deux workspaces TypeScript. Le démarrage lance Node directement afin que Fastify reçoive les signaux d’arrêt.

Le déploiement de revue utilise la branche de tâche explicite, avec déploiement automatique désactivé. Pour une livraison ultérieure, déployez le commit revu après ses contrôles ; passer à une branche de livraison constitue un changement explicite de configuration. Conservez les protections du dépôt. Un service web gratuit peut se mettre en veille ; la première requête peut prendre plus de temps.

Vérifiez un déploiement terminé à l’état `live`, les redirections de racine/langue, une vraie réponse `/v1/countries`, `/v1/dataset`, les deux langues de documentation et `/health/ready`. La création du service ou l’acceptation du déclenchement ne prouve pas sa disponibilité.
