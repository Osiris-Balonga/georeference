# Sources Congo et licences

[English](data-sources.md) · [Couverture du référentiel](congo-reference.fr.md) · [Accueil](../README.fr.md)

## Référentiel factuel intégré

La CLI lit par défaut l'asset d'exécution vérifié `reference/congo.json`, composé de faits sur la République du Congo. Elle ne télécharge pas une liste de pays GeoNames pour en déduire des villes ou quartiers. Un résumé humain de couverture/sources accompagne chaque export ; `--audit` inclut le détail des URLs, dates, localisateurs et révisions disponibles. Les PDF complets du Journal officiel et les données personnelles/électorales sans lien ne sont pas distribués.

Les sources combinent observations électorales publiques de 2022, tableaux municipaux de quartiers observés en janvier 2024 et reproduits dans un rapport public de juin 2024, lois territoriales d'octobre/décembre 2024 et registre administratif/électoral national de 2025. Le [guide du référentiel](congo-reference.fr.md) fournit URLs exactes, dates, hiérarchie et traitement des ambiguïtés. Ces dates ne signifient pas que chaque lieu a été revérifié en 2026.

Seule une observation nommée admissible avec un parent documenté entre dans une sortie de quartiers nommés. Un code numérique sans nom vérifié constitue un manque, pas une autorisation d'inventer un libellé. Bureaux de vote, écoles et lieux figurant dans une autre colonne ne deviennent pas automatiquement des quartiers. Les observations non classées et graphies contradictoires restent explicites plutôt que fusionnées silencieusement.

## Droits et attribution

Code et documentation sont [sous MIT](../LICENSE). Les faits conservent leur provenance et leurs conditions sources. La [loi congolaise 24-82 du 7 juillet 1982](https://www.sgg.cg/textes-officiels/lois/1982/congo-loi-1982-24.pdf), article 14 page 4, exclut de cette loi sur le droit d'auteur les textes législatifs, judiciaires et décisions administratives ainsi que leurs traductions officielles. Le référentiel extrait des faits administratifs de ces actes ; il ne place pas sous MIT l'ensemble des sites publics, cartes, photos ou rapports tiers.

Conservez instrument/date/page/article et révisions SHA-256 disponibles lors de la redistribution. Les tableaux municipaux ne fournissent que noms, codes et parents factuels ; ni prose ni illustrations du rapport ne sont republiées, et aucune licence générale de données ouvertes n'est affirmée. Une empreinte identifie des octets sources ou l'intégrité d'un export, pas l'auteur ni l'exhaustivité géographique actuelle. Toute source ajoutée exige sa propre évaluation des droits ; la lecture publique ne suffit pas à établir une licence ouverte.

## Entrées personnalisées

Les entrées personnalisées doivent respecter le contrat de ressources Congo UUID typées et garder leurs sources/couverture. Un helper d'import ne détermine pas à lui seul les types géographiques vérifiés. Si vous utilisez l'ancien importeur pays GeoNames comme outil bas niveau de compatibilité, sa [documentation officielle](https://download.geonames.org/export/dump/readme.txt) précise [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Gardez l'attribution GeoNames pour les données qui en proviennent. Ce parcours facultatif limité au pays ne fournit pas les quartiers intégrés ni les rattachements territoriaux corrigés.

Aucun point ni polygone n'est inventé. De futures géométries nécessitent des preuves indépendantes de couverture, précision, révision et redistribution. Téléchargements réels et exports générés restent dans des répertoires de travail ignorés ; le catalogue factuel intégré est maintenu séparément des exports de production.

Les données fictives servent uniquement aux tests ; elles ne constituent ni le catalogue ni un repli par défaut. Une panne réseau ou une observation absente ne déclenche aucune sortie géographique inventée.
