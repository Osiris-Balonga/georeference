# Site public

[English](website.md) · [Architecture](architecture.fr.md)

Le workspace privé Next.js App Router `apps/web` présente la République du Congo au grand public : accueil, aperçu des territoires, projet et sources, explorateur et fiches de lieux. Les composants shadcn/ui suivent les tokens des maquettes validées. FR/EN, préférences système de langue et de thème, choix manuels persistants et réduction des animations sont pris en charge. Les illustrations restent signalées ; aucune géométrie n’est inventée comme donnée.

## Lancement

```sh
npm ci
npm run build:site
npm run start:site
```

Ouvrez http://localhost:3000 . Le superviseur lance Next.js sur `PORT` (3000 par défaut) et Fastify sur le port interne 3001, en boucle locale. Les routes `/v1/*`, `/docs/*`, `/openapi.json` et `/health/*` passent vers Fastify. Une panne ou SIGTERM arrête les deux processus. La CLI npm reste indépendante.

En développement, lancez l’API sur 3001 avec `npm run dev:api` et la variable `PORT=3001` adaptée à votre terminal, puis `npm run dev:web`. Si 3001 est occupé, définissez `API_INTERNAL_ORIGIN=http://127.0.0.1:4101` avant la compilation Next.js et `API_INTERNAL_PORT=4101` au démarrage. Les réécritures Next sont déterminées à la compilation : ces réglages doivent correspondre.

## Recherche et navigation

Les paramètres `q`, `resource`, `parent` et `offset` portent l’état partageable. Recherche et filtres créent une entrée d’historique ; changer un filtre remet la pagination à zéro. Précédent/suivant du navigateur et changement de langue conservent la recherche. La saisie est soumise explicitement. TanStack Query met les réponses en cache cinq minutes et annule les requêtes devenues inutiles. Chargement, erreur, liste vide et réinitialisation sont prévus. Select et Sheet de shadcn/ui conservent les interactions clavier et le focus de Radix.

Les pages serveur lisent le catalogue versionné partagé ; l’explorateur consomme l’API. Aucun second stock de données ni duplication des règles de rattachement. Les libellés sont traduits, les noms propres conservés. Département et commune homonymes restent distincts par leur catégorie et UUID.

L’entrée pays publique est `GET /v1/congo`. `GET /v1/search` réunit recherche, catégorie, territoire parent et pagination ; `direct=true` sélectionne uniquement les enfants directs. `GET /v1/places/{id}` fournit le lieu typé et ses ancêtres. Les anciennes routes pays restent compatibles et sont dépréciées dans OpenAPI, hors navigation principale de la doc. Le modèle interne reste extensible.

## Affichage et vérification

Le contenu est limité à 1280 px sur grands écrans ; fonds et footer prennent toute la largeur. Le footer a une hauteur minimale d’un viewport et peut grandir sur mobile. Le panorama est contenu sans recadrer les monuments. Les animations d’apparition et d’arrivée de page sont désactivées avec la préférence de mouvement réduit. Polices et images sont locales ; la provenance des illustrations est décrite dans `apps/web/public/images/README.md`.

`npm run check` contrôle cœur/API/web et compile Next.js. `npm run test:site` lance le serveur combiné compilé et contrôle langues, pages, ressources, CSP de la doc et données réelles. `SITE_URL` permet de viser un serveur local déjà lancé. La vérification navigateur couvre séparément les interactions et les dimensions.

Pour une future livraison Render : compilation `npm ci --include=dev && npm run build:site`, démarrage `npm run start:site`, sonde `/health/ready`. Dans cette topologie, Fastify reçoit le trafic de la passerelle en boucle locale : sa limite par IP directe est donc agrégée ; ajustez `API_RATE_LIMIT_MAX` au trafic attendu. Aucun en-tête d’IP transmis n’est accepté sans confiance explicitement configurée. Ces fichiers ne modifient pas la configuration Render existante.
