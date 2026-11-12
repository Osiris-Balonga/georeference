# Référentiel Congo : hiérarchie, couverture et provenance

[English](congo-reference.md) · [Générer les fichiers](generation.fr.md) · [Accueil](../README.fr.md)

## Périmètre et dates

Le référentiel intégré concerne exclusivement la **République du Congo, CG/COG**. Il contient des faits vérifiés sur des unités administratives réelles et des quartiers observés dans les sources, avec des IDs stables conservés. Ce n'est ni un exemple fictif, ni un répertoire mondial, ni un recensement exhaustif de chaque quartier/village en 2026.

Le catalogue combine plusieurs dates. Les tableaux électoraux publics et municipaux fournissent des noms de quartiers datés ; des lois ultérieures établissent les changements de rattachement ; un tableau national de 2025 corrobore les départements. Consultez `coverage.json` et `provenance.json` pour les effectifs et manques de la révision livrée. Une date de publication logicielle ne devient pas la nouvelle date d'observation des lieux.

### Révision vérifiée `cg-reference-2026-11-12.1`

Cette révision contient **398 entités** : 1 pays, 15 départements, 16 communes, 23 arrondissements, 89 districts, 4 communautés urbaines et 250 quartiers nommés. Ce sont les effectifs du référentiel, **pas des totaux nationaux vérifiés** pour chaque type. Il conserve aussi 10 libellés juridictionnels non résolus et 29 observations historiques de quartiers codés restant sans nom après rapprochement avec 2024. Ces observations sont des lacunes, pas des entités nommées supplémentaires. Aucun inventaire exhaustif de villages nommés n'est annoncé.

## Sources

| Preuve | Date et source primaire exacte | Usage et limites |
|---|---|---|
| Tableaux électoraux publics | Arrêté 4981 du 30 juin 2022 ; publication le 14 juillet dans le [Journal officiel 28-2022](https://www.sgg.cg/JO/2022/congo-jo-2022-28.pdf), début de l'acte p.1000 imprimée/p.64 PDF | Observations de quartiers/villages nommés et en-têtes explicites de commune/arrondissement. Lire la colonne géographique, pas les lieux de vote d'une autre colonne. Les codes seuls ne prouvent pas un nom. |
| Tableaux municipaux de quartiers | Observations des mairies en janvier 2024, reproduites dans le [plan de réinstallation du programme de drainage de Brazzaville](https://www.finances.gouv.cg/sites/default/files/documents/DIFFUSION_MINEF_PLAN_D%E2%80%99ACTION_DE_REINSTALLATION.pdf), rapport daté du 19 juin 2024, tableaux 11–12, pp.37–40 imprimées | Noms/codes datés d'Ouenzé et Talangaï ; le mois d'observation municipale diffère de la publication. La légende incohérente du tableau 12 reste signalée ; section/source identifient Talangaï. Seules les cellules factuelles sont transcrites. |
| Réorganisation territoriale | Lois 24–34 du 8 octobre 2024, publication le 17 octobre dans le [Journal officiel 42-2024](https://www.sgg.cg/JO/2024/congo-jo-2024-42.pdf), pp.1304–1308 imprimées/pp.4–8 PDF | Nouveaux départements/district et changements de rattachement, dont Djoué-Léfini, Nkéni-Alima, Congo-Oubangui et rattachement de Kintélé au département de Brazzaville. |
| District et communautés urbaines | Lois 39–42 du 2 décembre 2024, publication le 19 décembre dans le [Journal officiel 51-2024](https://sgg.cg/JO/2024/congo-jo-2024-51.pdf), pp.1554–1557 imprimées/pp.16–19 PDF | Bouemba relève des Plateaux ; statut de communauté urbaine de Mpouya, Ngouha II et Ngombé. Ces actes n'énumèrent pas tous les quartiers intérieurs. |
| Registre national | Arrêté 1856 du 10 juillet 2025, publication le 17 juillet dans [l'extrait officiel SGG](https://www.sgg.cg/textes-officiels/arretes/2025/congo-arrete-2025-1856.pdf), annexe pp.929–931 imprimées/pp.2–4 PDF | Groupes départementaux et juridictions nommées. Les en-têtes mixtes et graphies différentes exigent un rapprochement juridique/municipal, sans correction silencieuse. |

Dates de signature/loi et de publication sont distinctes. Elles ne prouvent pas automatiquement une date d'entrée en vigueur établie séparément. Les localisateurs et révisions d'octets disponibles restent attachés aux preuves.

## Sens administratif et bons parents

`entityType` est la classe de stockage ; `kind` précise le sens administratif. Ce dernier peut identifier pays, département, commune, district, arrondissement, communauté urbaine/rurale, quartier, village ou unité explicitement non classée. Un nom d'affichage seul ne détermine pas le statut juridique.

La [loi primaire 3-2003 du 17 janvier 2003](https://www.sgg.cg/textes-officiels/lois/2003/congo-loi-2003-03.pdf), pages 2–4, établit une hiérarchie variable :

- Articles 9 et 20 : un département regroupe des districts et parfois des communes ; un district peut contenir des communautés urbaines/rurales.
- Articles 13, 15 et 16 : une commune peut se subdiviser en arrondissements et quartiers ; l'arrondissement est une subdivision de commune contenant des quartiers.
- Article 27 : un quartier peut relever **d'une commune, d'un arrondissement ou d'une communauté urbaine**. L'arrondissement n'est pas un passage obligé partout.

Département et commune de Brazzaville ont des identités distinctes. La commune de Kintélé dépend du **département de Brazzaville**, pas automatiquement de sa commune. District et chef-lieu/communauté urbaine homonymes nécessitent aussi des identités distinctes. Le parent vient d'une preuve, pas du point géographique le plus proche.

## Sens des fichiers complémentaires

| Fichier | Signification |
|---|---|
| `coverage.json` | Effectifs du référentiel/de l'export, état de couverture géographique, dates, manques par commune, observations codées/non classées et conflits connus. |
| `provenance.json` | Preuves des entités sélectionnées : URLs, dates, articles/pages et révisions sources disponibles. |
| `manifest.json` | Intégrité des fichiers, requête d'export, versions du jeu/générateur et rôles des métadonnées. |

Le catalogue déclare explicitement une couverture géographique **partielle**. `scope.complete` indique si l'export couvre le périmètre sélectionné de son instantané ; cela n'en fait pas un recensement exhaustif du territoire. Les ancêtres inclus pour l'intégrité sont du contexte et peuvent augmenter le nombre de lignes.

Un résultat vide signale l'absence d'observation, pas l'absence de quartiers dans une commune. Codes seuls, graphies non résolues, observations actuelles manquantes et géométries absentes restent des lacunes visibles. Un nom source n'est pas remplacé par un nom plus familier sans preuve ; les alias doivent être étayés. L'identité pays `geonames:2260494` est conservée ; les IDs internes ne deviennent pas des codes administratifs officiels.

Couverture/provenance sont des métadonnées du manifeste, pas des entités à injecter en base. Conservez-les avec les exports partagés/téléchargés. Un export filtré ne prouve pas qu'une entité omise doit être supprimée d'une base applicative.

## Géométries et actualisation

Aucune coordonnée, frontière, nom de quartier ou relation ne sont inventés pour combler les manques. Les sources par défaut sont documentaires ; les options géométriques n'incluent que des géométries fournies et validées. Aucun rafraîchissement réseau automatique ne modifie les données intégrées entre deux exécutions.

Une mise à jour exige des preuves relues, le maintien des IDs et une nouvelle révision des données. Une nouvelle version logicielle ne rend pas actuelles les observations anciennes. Voir [les licences](data-sources.fr.md), [l'amorçage](seeding.fr.md) et [la contribution](../CONTRIBUTING.fr.md).
