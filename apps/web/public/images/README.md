# Website images

## Documentary photographs — CC BY-SA 4.0

These photographs and their optimized derivatives retain [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), independently of the repository's MIT code license. Attribution is also available on the public Project page, linked from the footer.

| Delivered files | Original work and author | Delivered dimensions |
| --- | --- | --- |
| `brazzaville-*.webp` | [Quartier OCH](https://commons.wikimedia.org/wiki/File:Quartier_OCH.jpg), Prével EPOTA | 384×216, 768×432, 1280×720 |
| `pointe-noire-*.webp` | [Pointe-Noire Beach](https://commons.wikimedia.org/wiki/File:Pointe-Noire_Beach.jpg), user:unsonique | 384×288, 768×576, 1200×900 |
| `dolisie-*.webp` | [Gare de Dolisie](https://commons.wikimedia.org/wiki/File:Gare_de_Dolisie.jpg), Allweno | 384×288, 768×576, 1280×960 |

Changes: resized, re-encoded as WebP and metadata removed; display containers may crop photographs with `object-fit: cover`. No scene elements were added or removed. Dates and views describe the source photographs, not current conditions. Native `srcset`/`sizes` choose the appropriate resolution; larger editorial images are lazy-loaded.

## Generated illustrations

The map backdrop, transparent Brazzaville skyline and matching day/night skies were generated for the approved website design. They are artistic illustrations, not surveyed geography or administrative boundaries. Their nature is explained on the Project page. The skyline evokes the Corniche bridge, Nabemba, Sainte-Anne and Mpila towers without claiming measured positions or scale.

All four skyline files resize the **same wide composition**, preserving relative landmark positions: `skyline-mobile.webp` 640×214, `skyline.webp` 960×320, `skyline-1440.webp` 1440×480 and `skyline-desktop.webp` 2172×724. There is no separate compact mobile composition. Native `srcset` selects a resolution. The footer frame trims transparent sky; it does not squeeze or rearrange buildings.

`footer-sky-day.webp` and `footer-sky-night.webp` share the same framing and cloud placement. CSS selects the blue daytime or starry nighttime sky according to the active theme. The skyline is the footer's last element. `map.webp` is decorative; the catalog still has no measured geometry.

`skyline-og.png` is a 960×320 PNG encoding of the same skyline, used by the local Open Graph image renderer. It adds no new landmark composition. Social cards render text and the shared pin logo as vector/HTML content above it.

Core labels, controls, statistics and relationships are accessible HTML from the versioned catalog, never baked into an image.
