# Sources et licences des données

[English](data-sources.md) · [Accueil](../README.fr.md)

## La licence du logiciel n'est pas celle des données

Le code, la documentation et les exemples fictifs de GeoReference sont sous MIT. Les données géographiques tierces conservent leur licence et leurs exigences d'attribution. Le manifeste transporte les métadonnées sources pour que les destinataires les conservent. Vérifiez les droits de redistribution avant d'ajouter ou de publier une source ; un writer fonctionnel n'accorde aucun droit sur ses données d'entrée.

## Entrées GeoNames

L'importeur local accepte les fichiers GeoNames UTF-8 séparés par tabulations :

| Option CLI | Entrée | Couverture de cet importeur |
|---|---|---|
| `--countries` | `countryInfo.txt` | Noms/codes pays et identifiants sources ; obligatoire |
| `--admin1` | `admin1CodesASCII.txt` | Premier niveau administratif ; facultatif |
| `--admin2` | `admin2Codes.txt` | Deuxième niveau administratif ; facultatif |
| `--places` | Fichier d'entités GeoNames extrait, par exemple `cities1000.txt` | Lieux habités (classe `P`) et coordonnées ponctuelles ; facultatif |

GeoNames publie ses extraits sous [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Consultez [la documentation officielle](https://download.geonames.org/export/dump/readme.txt) et [le répertoire de téléchargement](https://download.geonames.org/export/dump/). GeoReference enregistre l'attribution GeoNames, l'URL source et une révision SHA-256 de chaque fichier. Cette empreinte identifie les octets locaux ; elle ne certifie pas que tous les fichiers proviennent de la même date de publication.

Téléchargez et extrayez avant ingestion. Conservez les fichiers téléchargés pour reproduire un instantané ; attribuez une `--version` pertinente sans remplacer silencieusement une version publiée. Ce parcours hors ligne ne demande ni compte GeoNames ni clé API.

## Limites de couverture explicites

- L'importeur exploite les fichiers administratifs de niveau 1/2 fournis ; il ne promet pas tous les niveaux administratifs ni toutes les localités mondiales. Les petits extraits de villes sont des sous-ensembles.
- Un fichier ou rattachement administratif absent conduit au plus proche ancêtre fourni. Le code brut `geonamesAdmin` reste disponible ; cela n'affirme pas l'absence de niveaux intermédiaires.
- CountryInfo seul ne fournit pas les géométries ponctuelles facultatives dans cet importeur. Aucun point n'est inventé pour les pays/subdivisions. Cet adaptateur n'importe ni frontières ni noms alternatifs avec langue.
- Le cœur accepte des polygones/multipolygones canoniques depuis vos propres sources dûment licenciées. Il ne reconstitue pas une frontière à partir de points et ne tranche pas les revendications territoriales.
- La lecture des fichiers est progressive, mais cet importeur conserve les entités canoniques et tables de correspondance en mémoire avant création de l'instantané. Il convient à des entrées mesurées, sans garantie illimitée pour `allCountries`. Utilisez des entrées bornées par pays/taille et mesurez les ressources.
- Les doublons, IDs/coordonnées mal formés et références vers des pays inconnus font échouer l'ingestion. Modifications, suppressions, fusions et scissions exigent des règles d'identité explicites ; les IDs stables ne réconcilient pas automatiquement l'historique.

Les jeux générés, instantanés, téléchargements sources et exports restent dans des répertoires locaux ignorés comme `data/` et `exports/`. Ils ne sont pas commités dans le dépôt logiciel.

## Exemple fictif

L'[exemple suivi](../examples/README.md) décrit des lieux fictifs, une frontière carrée inventée et des coordonnées de démonstration. Son URL source est réservée et invalide ; sa licence est MIT. Il sert aux tutoriels et tests, pas à des décisions géographiques.
