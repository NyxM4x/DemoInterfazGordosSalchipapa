# Plantilla de menú demo: cómo cambiar de restaurante

El menú (`/menu`) es una plantilla. La lógica (vitrina, carrito, elección
"Con todo / Quitar" por unidad, pedido por WhatsApp) **no se toca**. Para un
restaurante nuevo solo se cambian **cuatro cosas**: datos, colores, fotos y,
si hace falta, fuentes.

| Qué | Dónde |
|---|---|
| 1. Datos: nombre, horario, WhatsApp, platos, precios, ingredientes quitables | `src/config/restaurant.ts` |
| 2. Colores | bloque **MARCA DEL RESTAURANTE** al inicio de `src/app/globals.css` |
| 3. Fotos y logo | `public/menu/<local>/` + `npm run fotos` |
| 4. Fuentes (opcional) | `src/app/layout.tsx` |

La demo corre sin Supabase ni Kapso: con `SUPABASE_URL` vacío (o
`MENU_DEMO=true`) los platos salen de `config/restaurant` y "Continuar pedido"
abre WhatsApp con el resumen.

---

## 1. Datos — `src/config/restaurant.ts`

Todo en el objeto `RESTAURANT`:

- `name`, `tagline` (frase bajo los platos de la portada), `watermark` (texto
  del empapelado del fondo, `null` para quitarlo).
- `themeColor`: color de la barra del navegador y de la marca de agua. El
  mismo que `--color-donzarco-ink` (paso 2).
- `logo`, `heroBackground` (foto de la portada), `heroDishes` (los 3 `code`
  que flotan en la portada: centro, izquierda, derecha).
- `hours`, `whatsapp` (con código de país, sin `+`), `mapsUrl`, `currency`.
- `categories` (nombre de cada sección), `categoryTaglines` (bajada bajo el
  título), `sectionOrder`.
- `products`: un objeto por plato.

```ts
{
  code: 'lomito_completo',      // único, minúsculas y _ (no se ve)
  name: 'Lomito Completo',
  category: 'plato',            // 'plato' | 'extra' | 'bebida'
  price: 35,
  priceFrom: false,             // true = "Precios desde"
  description: 'Lomo a la plancha, queso, tomate…',
  image: '/menu/milonguita/lomito.webp',   // null = tarjeta con "Foto pronto"
  removables: ['Tomate', 'Lechuga', 'Queso'], // opcional, ver abajo
}
```

**`removables` — elección obligatoria "Con todo / Quitar".** Si un plato los
tiene, en el carrito cada unidad debe quedar "Con todo" (verde ✓) o con algo
para quitar (rojo ✕) antes de continuar. Al quitar en una fila de varias
unidades se separa una y el resto queda "Con todo". Sin `removables`, el
plato no pide nada (papas, bebidas). La lógica está en
`src/lib/cart/preparation.ts`.

> **Ojo con el `code`:** no reusar códigos del catálogo viejo de
> `src/lib/menu/catalog.ts` (`PRODUCT_IMAGES`: `trancapecho`, `salchipapa`,
> `vaso_maracuya`…). Si un plato con `image: null` comparte código, toma la
> foto de otro restaurante.

## 2. Colores — `src/app/globals.css`

Solo el bloque **MARCA DEL RESTAURANTE** (arriba del archivo). Ningún
componente tiene colores de marca escritos a mano.

- `@theme` → clases Tailwind del carrito y checkout:
  - `--color-donzarco-ink`: el **color oscuro** de la marca (textos, fondos de
    tarjetas y paneles, sombras).
  - `--color-donzarco-surface`: el mismo, un poco más claro.
  - `--color-donzarco-gold` / `--color-donzarco-red`: el **acento** (precios,
    botones).
  - `--color-donzarco-red-dark/hover/active`: acento profundo para botones
    con texto blanco.
- `:root` → portada, tarjetas y fondo:
  - `--menu-bg`, `--menu-bg-top`, `--menu-bg-bottom`: el papel del fondo.
  - `--menu-hero-top`, `--menu-hero-mid`: **el color de la pared de la foto
    de portada**, para que se funda sin bordes. Sacarlo con un cuentagotas
    de la foto.
  - `--menu-card-top`, `--menu-card-bottom`: degradado de las tarjetas.
  - `--menu-glow`: resplandor cálido detrás de cada foto.
  - `--menu-orange`: acento principal (nombre heredado).
  - `--menu-cream`: texto claro sobre las tarjetas.
  - `--menu-stripe-a`, `--menu-stripe-b`: franja decorativa A·B·A (bandera,
    colores del logo).

**Criterio para que se vea antojable y no "de producto":** color oscuro de
marca de FONDO, acento cálido (dorado, ámbar) para plata y botones, y los
colores vivos del logo o bandera solo en detalles finos (la franja). Mucho
color plano y frío hace que el menú parezca un envase.

Si el nombre `donzarco-*` molesta, se puede renombrar, pero tocaría todos los
componentes del menú: no hace falta para cambiar de restaurante.

## 3. Fotos — `public/menu/<local>/` + `npm run fotos`

Qué pedir (o generar):

- **Productos**: PNG con **fondo transparente**, cuadrado, producto entero
  con margen, mismo ángulo (3/4 elevado, ~30–35°) y misma luz en todos, sin
  sombra en el piso (la pone el CSS). El efecto 3D sale de que la foto
  recortada se sale de la tarjeta.
- **Portada**: foto vertical o casi cuadrada con el letrero arriba y espacio
  libre abajo (ahí flotan los 3 platos). Mejor pared clara y lisa.
- **Logo**: cuadrado o redondo; si es redondo con esquinas de color, el
  script lo recorta en círculo.

Procesarlas, todas con el mismo formato (recorte, margen, 800×800 WebP):

```bash
npm run fotos -- public/menu/mi-local --portada fondo.jpg --logo logo.png
```

Escribe `lomito.png → lomito.webp`, `fondo-principal.webp` y `logo.webp` al
lado de los originales. Después, poner las rutas `/menu/mi-local/...` en
`config/restaurant.ts`.

## 4. Fuentes (opcional) — `src/app/layout.tsx`

- `--font-display` (títulos y nombres): hoy **Shrikhand**.
- `--font-price` (precios): hoy **Lilita One**. Tiene que tener dígitos
  inconfundibles (que el 7 no parezca un 1).
- `--font-body` (texto): **Poppins**.

Se cambian importando otra de `next/font/google` y apuntando la variable en
`@theme inline` de `globals.css`.

## Revisar al terminar

1. `npm run dev` y abrir `http://localhost:3000/menu` en tamaño celular.
2. Portada: la foto se funde con el fondo, nada cortado.
3. Agregar 2 de un plato con `removables`, quitar un ingrediente a uno,
   y "Continuar pedido": el mensaje de WhatsApp lleva el detalle por unidad.
4. `npx tsc --noEmit` y `npm run lint`.
