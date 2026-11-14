# Site public

[English](website.md) · [Architecture](architecture.fr.md)

Le workspace privé Next.js App Router `apps/web` présente la République du Congo au grand public : accueil, aperçu des territoires, projet et sources, explorateur et fiches de lieux. Les composants shadcn/ui suivent les tokens des maquettes validées. FR/EN, préférences système de langue et de thème, choix manuels persistants et réduction des animations sont pris en charge. Le site public et les guides produit utilisent **242Places** ; les pages de référence API natives utilisent **242Places API**. La page Projet distingue illustrations décoratives, photographies documentaires et géographie mesurée.

## Lancement

```sh
npm ci
npm run build:site
npm run start:site
```

Ouvrez http://localhost:3000 . Le superviseur lance Next.js sur `PORT` (3000 par défaut) et Fastify sur le port interne 3001, en boucle locale. Les routes `/v1/*`, `/docs/*`, `/openapi.json` et `/health/*` passent vers Fastify. Une panne ou SIGTERM arrête les deux processus. La CLI npm reste indépendante.

En développement, lancez l’API sur 3001 avec `npm run dev:api` et la variable `PORT=3001` adaptée à votre terminal, puis `npm run dev:web`. Si 3001 est occupé, définissez `API_INTERNAL_ORIGIN=http://127.0.0.1:4101` avant la compilation Next.js et `API_INTERNAL_PORT=4101` au démarrage. Les réécritures Next sont déterminées à la compilation : ces réglages doivent correspondre.

## Recherche et navigation

La recherche d’accueil propose des lieux après deux caractères et une pause de saisie de 250 ms, selon la catégorie du select shadcn. Chaque proposition affiche son type et ses ancêtres pour distinguer les homonymes. Les flèches choisissent une proposition, Entrée ouvre sa fiche UUID, Échap ferme les suggestions sans effacer la saisie. Sans sélection, la soumission ouvre l’explorateur avec `q` et `resource`. Une panne des suggestions n’empêche pas cette recherche. La page Congo réutilise le contrôle limité aux départements.

Les paramètres `q`, `resource`, `parent` et `offset` portent l’état partageable. Recherche et filtres créent une entrée d’historique ; changer un filtre remet la pagination à zéro. Précédent/suivant du navigateur et changement de langue conservent la recherche. La saisie est soumise explicitement. TanStack Query met les réponses en cache cinq minutes et annule les requêtes devenues inutiles. Chargement, erreur, liste vide et réinitialisation sont prévus. Select et Sheet de shadcn/ui conservent les interactions clavier et le focus de Radix.

Les pages serveur lisent le catalogue versionné partagé ; l’explorateur consomme l’API. Aucun second stock de données ni duplication des règles de rattachement. Les libellés sont traduits, les noms propres conservés. Département et commune homonymes restent distincts par leur catégorie et UUID.

L’entrée pays publique est `GET /v1/congo`. `GET /v1/search` réunit recherche, catégorie, territoire parent et pagination ; `direct=true` sélectionne uniquement les enfants directs. `GET /v1/places/{id}` fournit le lieu typé et ses ancêtres. Les anciennes routes pays restent compatibles et sont dépréciées dans OpenAPI, hors navigation principale de la doc. Le modèle interne reste extensible.

## Descriptions et découverte

Les fiches produisent une description FR/EN stable à partir du type de lieu, de ses vrais rattachements et du nombre de descendants recensés. Un quartier nomme son parent direct et, le cas échéant, sa commune. Une commune peut mentionner les arrondissements et quartiers recensés. Les nombres portent sur tout le catalogue, pas sur une page de résultats. La formule « Le référentiel y recense » rappelle la couverture partielle ; un nombre nul ne devient pas une affirmation d’absence de lieux. Aucun historique inventé ni variation aléatoire du texte.

L’accueil affiche toujours trois cartes : Brazzaville, Pointe-Noire et Dolisie avec leurs photographies respectives. Elles sont côte à côte sur desktop. Sur mobile, le défilement horizontal tactile ou au pavé tactile reste disponible avec une partie de la carte suivante visible ; sa barre est masquée sans bloquer le défilement vertical de la page. Aucun onglet de ville. La recherche globale reste ouverte à tous les lieux du catalogue ; la découverte ne réduit jamais silencieusement son périmètre.

La localisation reste facultative et traitée dans le navigateur. À l’arrivée, le site réutilise une permission déjà accordée pour placer la ville proche en premier, en gardant les trois cartes. Aucun bouton de position ni demande automatique de permission. Les coordonnées ne sont ni stockées ni envoyées à l’API ou à un service de géocodage. Refus, indisponibilité, position trop imprécise ou trop éloignée conservent l’ordre par défaut.

La proximité utilise trois points de découverte séparés du catalogue ([Brazzaville](https://www.wikidata.org/wiki/Q3844), [Pointe-Noire](https://www.wikidata.org/wiki/Q223920), [Dolisie](https://www.wikidata.org/wiki/Q246554)). Une précision supérieure à 20 km est rejetée ; une ville doit se trouver à moins de 30 km. Le résultat propose une ville proche, sans prétendre déterminer un rattachement administratif. Ces points n’ajoutent aucune géométrie mesurée aux données. La [documentation de géolocalisation du navigateur](https://developer.mozilla.org/fr/docs/Web/API/Geolocation_API) précise les permissions et le contexte sécurisé requis.

## Affichage et vérification

Le contenu est limité à 1280 px sur grands écrans ; fonds et footer prennent toute la largeur. Le footer a une hauteur minimale d’un viewport et peut grandir sur mobile. Le panorama est le dernier élément de la page, sans légende ni bande de copyright en dessous. Le ciel bleu de jour et sa déclinaison étoilée suivent le thème actif, avec des couleurs de texte contrastées propres au footer. Les variantes 640/960/1440/2172 px réduisent toutes la même composition large ; les monuments ne sont jamais rapprochés sur mobile. Seul le ciel transparent est recadré. La zone de découverte grandit avec ses contrôles et cartes, sans chevaucher la recherche. Les animations d’apparition et d’arrivée sont désactivées avec la préférence de mouvement réduit.

Polices, photographies et illustrations sont locales. Les photographies utilisent des WebP 384/768/1200 ou 1280 px choisis par `srcset`/`sizes`. Le panorama pèse environ 25 à 200 ko selon sa résolution ; chaque ciel environ 11 ko. Crédits et licence CC BY-SA 4.0 des photographies sont disponibles sur la page Projet et dans `apps/web/public/images/README.md` : la licence MIT du code ne remplace pas la leur. Carte, skyline et ciels générés restent des illustrations, pas des frontières administratives.

Les champs de recherche changent légèrement de surface au focus, avec un curseur visible, sans contour, anneau ni bordure inférieure ; les liens et boutons de catégorie conservent leur focus clavier. Lorsque la barre d’origine quitte entièrement le viewport par le haut, le même formulaire se fixe en bas sur mobile et en haut sur desktop. Champ, catégorie et saisie restent conservés ; aucun formulaire en double. Les suggestions s’ouvrent vers le haut sur mobile et la marge inférieure respecte la zone de sécurité. Remonter restaure la position initiale sans saut de mise en page. La préférence de mouvement réduit désactive l’animation d’arrivée.

Les rattachements d’une fiche gardent davantage d’espace sous leur titre sur mobile et tablette. La page Projet replie les documents sources tout en gardant les limites de couverture visibles. `npm run test:web` vérifie l’état URL, les descriptions et nombres, la proximité, les permissions et l’ordre des cartes, la recherche flottante et la conservation de saisie, ainsi que les interactions de recherche avec React Testing Library/jsdom.

Le bouton de thème montre uniquement le soleil ou la lune correspondant au thème résolu. Le premier affichage suit le système, avec le sombre en repli si l’information manque. Un clic bascule directement entre clair et sombre et mémorise ce choix ; les changements du système sont suivis jusqu’à ce choix explicite. Les flèches Unicode des textes d’interface laissent place à des libellés simples ou à des icônes Lucide lorsque la direction est utile.

## Référencement et partage

Les pages publiques ont des titres et descriptions localisés, une URL canonique propre et des liens `hreflang` FR/EN réciproques. Les descriptions des fiches reprennent leur type et leurs vrais rattachements. La racine ouvre l’accueil selon la langue ; le bouton Documentation ouvre `/docs/{langue}/introduction`. Les résultats de recherche utilisent `noindex, follow` et une URL canonique sans paramètres pour éviter l’indexation de toutes les combinaisons de filtres. Fiches de lieux et pages éditoriales restent indexables.

`/sitemap.xml` contient les pages accueil/Congo/projet et chaque UUID stable de lieu dans les deux langues, avec leurs alternances. Il exclut les recherches et n’invente pas de date de modification à chaque requête. `/robots.txt` pointe vers ce sitemap et exclut les routes API et de santé. Les données structurées `WebSite` de l’accueil et `BreadcrumbList` des fiches décrivent le produit visible et ses rattachements ; le JSON est échappé avant insertion dans le HTML.

`/{langue}/opengraph-image` produit un PNG local 1200×630 avec la marque, l’accroche traduite et le panorama redimensionné. Open Graph et Twitter utilisent des URL publiques absolues. `PUBLIC_SITE_URL` permet de changer d’origine lors du passage à un domaine personnalisé ; conserver la même valeur à la compilation et au démarrage. Par défaut : `https://two42places.onrender.com`.

Ces choix suivent la [documentation Next.js](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) et les recommandations Google sur les [URL canoniques](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), les [versions localisées](https://developers.google.com/search/docs/specialty/international/localized-versions) et les [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). L’indexation et le classement dépendent des moteurs. Après vérification du domaine dans Google Search Console, le propriétaire peut soumettre `/sitemap.xml` et inspecter ses URL ; aucun jeton de vérification ni résultat d’indexation n’est inventé.

## Validation et hébergement

`npm run check` contrôle cœur/API/web et compile Next.js. `npm run test:site` lance le serveur combiné compilé et contrôle langues, pages, ressources, métadonnées, sitemap, PNG de partage, CSP de la doc et données réelles. `SITE_URL` permet de viser un serveur local déjà lancé. La vérification navigateur couvre séparément les interactions et les dimensions.

Le service Node Render gratuit existant utilise la compilation `npm ci --include=dev && npm run build:site`, le démarrage `npm run start:site` et la sonde `/health/ready`. Il suit `main` après réussite des contrôles CI. Fastify reçoit le trafic de la passerelle en boucle locale : sa limite par IP directe est donc agrégée ; ajustez `API_RATE_LIMIT_MAX` au trafic attendu. Aucun en-tête d’IP transmis n’est accepté sans confiance explicitement configurée. Site, `/docs/*` et `/v1/*` restent sur la même origine, sans second service payant.
