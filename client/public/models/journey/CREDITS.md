# Journey (driving) — asset credits

The 3D driving journey at `/journey/drive` can use optional GLB models placed in
this folder. If a model is missing, the game falls back to procedural geometry,
so it always runs.

Files (all optional; missing ones fall back to procedural shapes):

- `car.glb` — the player's car (currently Kenney/mrdoob `vehicle-truck-red`)
- `Textures/colormap.png` — shared palette texture the Kenney GLBs reference
- `tree.glb` — roadside trees that show positive quotes (procedural by default)
- `house-garage.glb` — a house with a garage bay / station (procedural by default)

Note: the Kenney racing GLBs reference `Textures/colormap.png` *relative to the
GLB*, so that texture must live alongside the models here.

## Sourcing (CC0 / MIT)

- Inspired by **mrdoob's Starter‑Kit‑Racing** (MIT) — https://github.com/mrdoob/Starter-Kit-Racing
- 3D assets by **Kenney** (CC0) — https://kenney.nl/assets (Car Kit, Nature Kit, City Kit)

Run `node scripts/fetch-journey-assets.mjs` to attempt an automated download,
or drop your own GLB files here using the names above.
