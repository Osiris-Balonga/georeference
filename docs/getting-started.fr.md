# Prise en main

[English](getting-started.md) · [Accueil](../README.fr.md) · [Génération](generation.fr.md)

Utilisez Node.js 24.18.x et `npx 242places@1.2.0`. Les contributeurs peuvent également compiler les sources avec `npm ci` et `npm run build`.

```sh
npx 242places@1.2.0 generate --format xlsx --output ./exports/congo-excel
npx 242places@1.2.0 generate --format json --output ./exports/congo-json
npx 242places@1.2.0 verify --package ./exports/congo-json
```

Ouvrez `exports/congo-excel/congo.xlsx` pour les listes. Les tableaux applicatifs sont dans `exports/congo-json/communes.json`, `arrondissements.json`, `neighborhoods.json`, etc. Lisez `README.txt` pour les dates et la couverture partielle. `verify` contrôle l'intégrité, pas l'exhaustivité géographique.

## Lire les JSON dans une application

L'exemple suppose que l'application sert les ressources générées sous `/data/`. Il exige le serveur web de l'application et ne s'exécute pas en ouvrant une page via `file://`.

```js
const load = async name => {
  const response = await fetch("/data/" + name + ".json");
  if (!response.ok) throw new Error("Unable to load " + name);
  return response.json();
};

const [communes, arrondissements, neighborhoods] = await Promise.all([
  load("communes"), load("arrondissements"), load("neighborhoods")
]);

const brazzaville = communes.find(row => row.name === "Brazzaville");
const cityArrondissements = arrondissements.filter(
  row => row.communeId === brazzaville?.id
);
const talangai = cityArrondissements.find(row => row.name === "Talangaï");
const quarters = neighborhoods.filter(
  row => talangai && row.arrondissementId === talangai.id
);
```

Utilisez les noms pour l'affichage et les UUID pour les sélections enregistrées. Un formulaire de production doit réinitialiser les choix descendants quand le parent change, gérer échecs/listes vides et prendre en charge les quartiers rattachés directement via `communeId` ou `urbanCommunityId`. Une observation nommée manquante ne prouve pas l'absence de quartier.

## Préparer PostgreSQL séparément

```sh
npx 242places@1.2.0 generate --format ndjson --output ./exports/congo-seed
npx 242places@1.2.0 seed --package ./exports/congo-seed --create-schema
npx 242places@1.2.0 seed --package ./exports/congo-seed --create-schema --apply
```

Définissez d'abord `DATABASE_URL` dans votre environnement. L'aperçu est en lecture seule ; `--apply` écrit. CSV/XLSX humains, scripts SQL et fichiers SQLite ne sont pas des entrées de seeding équivalentes. Utilisez le paquet JSON/NDJSON de ressources vérifié. Voir [l'import en base](seeding.fr.md) pour les noms et limites des schémas existants.

## SDK optionnel

Lire les fichiers générés ne nécessite pas `npm install 242places`. Une application choisissant le SDK peut installer `242places@1.2.0`.

```ts
import { loadCongoReference, toResourceTables } from '242places';

const reference = await loadCongoReference();
const resources = toResourceTables(reference.entities);
console.log(resources.communes);
console.log(resources.neighborhoods);
```

`exportResources` exporte une sélection d'instantané avec le modèle public ; `readResourcePackage` vérifie les paquets JSON/NDJSON de ressources pris en charge. L'instantané canonique et les anciens adaptateurs restent des composants de compatibilité, pas la présentation des fichiers publics. Voir [l'architecture](architecture.fr.md) et [la migration](migration.fr.md).

Un export SQLite contient les tables métier ; ce n’est pas l’instantané interne consommé par `Snapshot.open`. Pour consulter les ressources par HTTP plutôt que générer des fichiers ou installer le SDK, lancez l’application API privée depuis le code source. Voir [le guide API](api.fr.md). Le paquet publié `242places@1.2.0` ne démarre pas ce serveur.
