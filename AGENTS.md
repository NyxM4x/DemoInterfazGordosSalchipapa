<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Menú demo activo: GORDOS (salchipapas) — YA ESTÁ CONSTRUIDO, no rehacerlo

`/menu` es una plantilla de un restaurante a la vez y hoy muestra **Gordos**.
Guía general de la plantilla: `docs/PLANTILLA-RESTAURANTE.md`.

Dónde vive Gordos:

- Datos (nombre, eslogan, horario, platos, precios, quitables): `src/config/restaurant.ts`.
- Colores (ladrillo, ámbar de neón, fondo kraft): bloque **MARCA DEL RESTAURANTE** de `src/app/globals.css`.
- Fotos: `public/menu/gordos/`
  - `fondo-principal.webp`: portada, pared de ladrillo OSCURA con el letrero de neón (por eso `heroDark: true` y `heroShowName: false`; no hay logo aparte, `logo: null`).
  - `salchi1/2/3.webp`, `tocino.webp`: originales apaisados (900 de ancho). Se usan en la PORTADA vía `heroImage`.
  - `*-tarjeta.webp`: los mismos en 800×800 con margen lateral, para las TARJETAS (el original apaisado tapa el texto de la tarjeta). Se generan con sharp: `trim` → `contain` 640×640 → `extend` 80 px.
  - `soda1.webp` (cola), `soda2.webp` (soda de lima): verticales, se usan tal cual.

Pendiente de confirmar con el cliente: nombres, PRECIOS, eslogan y horario son
de relleno; `whatsapp` y `mapsUrl` siguen siendo los de prueba.

Otros restaurantes de la plantilla: La Milonguita (fotos en `public/menu/milonguita/`,
su config está en el commit `fcf550f`: `git show fcf550f:src/config/restaurant.ts`).
Para volver a uno de ellos se cambian los mismos tres lugares.

Ver la demo: `npm run dev` y abrir `/menu` (corre sin Supabase ni `.env`). Hay
11 tests de vitest que ya fallaban antes de Gordos (menu-ui, catalog, checkout/state,
migration-0039); no son de la plantilla.
