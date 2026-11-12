# Congo reference: hierarchy, coverage, and provenance

[Français](congo-reference.fr.md) · [Generate files](generation.md) · [Home](../README.md)

## Scope and dates

The bundled reference covers **Republic of the Congo, CG/COG**, exclusively. It is a curated factual reference of actual named administrative units and source-observed neighborhoods, with stable stored IDs. It is not a fictional example, an all-country gazetteer, or an exhaustive 2026 census of every neighborhood/village.

The catalog combines observations made at different dates. Government electoral tables and municipal tables supply dated neighborhood names; later laws establish changed administrative parents; a 2025 national table corroborates departmental membership. Read the generated `README.txt` for a coverage summary. Add `--audit` for detailed `coverage.json` and per-resource `provenance.json`. Do not infer a new observation date from the software release date.

### Curated revision `cg-reference-2026-11-12.2`

This revision has **398 entities**: 1 country, 15 departments, 16 communes, 23 arrondissements, 89 districts, 4 urban communities, and 250 named neighborhoods. These are reference counts, **not verified national totals** for every kind. It also records 10 unresolved jurisdiction labels and 29 historical code-only neighborhood observations remaining unnamed after the 2024 cross-reference. Such observations are gaps, not extra named entities. No complete named-village inventory is claimed.

## Source layers

| Evidence | Date and exact primary source | Use and limits |
|---|---|---|
| Government electoral tables | Arrêté 4981, June 30, 2022; published July 14, 2022 in [Journal officiel 28-2022](https://www.sgg.cg/JO/2022/congo-jo-2022-28.pdf), instrument starts printed p.1000/PDF p.64 | Named quartier/village observations and explicit commune/arrondissement headers. Read the geographic column, not polling-venue names in another column. Code-only rows do not establish names. |
| Municipal neighborhood tables | January 2024 mairie observations, reproduced in the government [Brazzaville drainage programme resettlement plan](https://www.finances.gouv.cg/sites/default/files/documents/DIFFUSION_MINEF_PLAN_D%E2%80%99ACTION_DE_REINSTALLATION.pdf), report dated June 19, 2024, tables 11–12, printed pp.37–40 | Dated names/codes for Ouenzé and Talangaï; municipal observation month differs from report publication date. The inconsistent table-12 caption is retained as a source defect; section/source evidence identifies Talangaï. Only factual cells are transcribed. |
| Territorial reorganization | Laws 24–34, October 8, 2024, published October 17 in [Journal officiel 42-2024](https://www.sgg.cg/JO/2024/congo-jo-2024-42.pdf), printed pp.1304–1308/PDF pp.4–8 | New departments/district and changed memberships, including Djoué-Léfini, Nkéni-Alima, Congo-Oubangui and Kintélé's attachment to Brazzaville department. |
| District and urban-community changes | Laws 39–42, December 2, 2024, published December 19 in [Journal officiel 51-2024](https://sgg.cg/JO/2024/congo-jo-2024-51.pdf), printed pp.1554–1557/PDF pp.16–19 | Bouemba district belongs to Plateaux; urban-community status for Mpouya, Ngouha II, and Ngombé. This does not enumerate every interior neighborhood. |
| National registry | Arrêté 1856, July 10, 2025, published July 17 in [official SGG extract](https://www.sgg.cg/textes-officiels/arretes/2025/congo-arrete-2025-1856.pdf), annex printed pp.929–931/PDF pp.2–4 | Department groupings and named jurisdictions. Mixed headings and source spelling differences require legal/municipal cross-reference; they are not silently corrected. |

Signature/law dates and publication dates are distinct. They do not automatically establish a separately verified legal commencement date. Source locators and available byte revisions remain attached to the evidence.

## Administrative meaning and correct parents

The internal catalog records administrative kinds. Public resources have separate collections/tables with named relationship fields; human lists show parent names. Do not determine legal status from a display name alone. Unclassified observations remain audit gaps, not asserted public resource categories.

The primary [law 3-2003 of January 17, 2003](https://www.sgg.cg/textes-officiels/lois/2003/congo-loi-2003-03.pdf), pages 2–4, establishes the relevant variable hierarchy:

- Articles 9 and 20: a department groups districts and sometimes communes; a district can contain urban/rural communities.
- Articles 13, 15 and 16: a commune can be divided into arrondissements and neighborhoods; an arrondissement is a commune subdivision containing neighborhoods.
- Article 27: a neighborhood can belong to **a commune, an arrondissement, or an urban community**. An arrondissement is not mandatory everywhere.

Department and commune named Brazzaville are distinct records. The commune of Kintélé belongs to **Brazzaville department**, not automatically to Brazzaville commune. A same-name district and head settlement/urban community likewise need separate identities. Correct parent assignment comes from evidence, not nearest-point matching.

## Coverage summary and optional audit

| File | Meaning |
|---|---|
| `README.txt` | Human summary of selected categories, dates and known coverage limits. |
| `coverage.json` (`--audit`) | Reference/export counts, geographic coverage status, observation dates, commune-level missing named coverage, code-only/unclassified rows, and known conflicts. |
| `provenance.json` (`--audit`) | Evidence for selected entities: source URLs, dates, article/page locators, and source revisions where available. |
| `manifest.json` | File integrity, export request, dataset/generator versions, and metadata-file roles. |

The catalog explicitly declares geographic coverage **partial**. `scope.complete` describes whether an export includes its selected snapshot's scope; it does not turn territorial coverage into an exhaustive census. Ancestors included for integrity are context and can increase exported row counts.

An empty result is a missing-observation result, not a declaration that a commune has no neighborhoods. Numeric-only quartiers, unresolved spellings, missing current observations, and absent geometries stay visible as gaps. Stored source names are not casually replaced with familiar names; aliases require evidence. Public identities are UUIDs assigned once and stored in `reference/identities.json`. That registry preserves correspondence with earlier source-style identities. Display-name changes must retain assigned UUIDs. UUIDs are internal reference identities, not newly official administrative codes.

Coverage/provenance files are manifest metadata, not geographic payloads for database seeding. Keep requested audit files with downloaded/shared exports. A filtered export cannot prove that an omitted entity should be deleted from an application database.

## Geometry and updating the reference

No invented coordinates, polygons, neighborhood names, or parent links fill gaps. The default source set is documentary; geometry options only include supplied, validated geometry. No automatic network refresh changes the bundled data between runs.

Updates need reviewed source evidence, stable-ID preservation, and a new data revision. A new application release does not make old source observations current. See [source licensing](data-sources.md), [seeding](seeding.md), and the [contribution guide](../CONTRIBUTING.md).
