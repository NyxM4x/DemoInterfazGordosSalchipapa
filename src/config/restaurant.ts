/**
 * Datos del restaurante de la DEMO — el ÚNICO archivo que hay que tocar para
 * cambiar de prospecto.
 *
 * Nombre, horario, WhatsApp, ubicación, categorías y platos viven aquí. El
 * catálogo (`lib/menu/catalog.ts`), la portada y las tarjetas leen de este
 * objeto, así que cambiar un precio o una foto es editar una línea.
 *
 * Fotos:
 *   - `image`: foto del plato. Idealmente un RECORTE SIN FONDO (PNG/WebP
 *     transparente, ~800×800): flota sobre la tarjeta con su sombra, como en la
 *     referencia. Una foto con fondo también funciona, pero se ve como un cuadro.
 *   - Van en `public/menu/` y se escriben aquí con su ruta pública (`/menu/...`).
 *
 * El `code` es el identificador interno del plato (minúsculas y `_`). No se ve
 * en pantalla; solo tiene que ser único.
 */
import type { MenuCategory } from '@/types';

export interface DemoProduct {
  code: string;
  name: string;
  category: MenuCategory;
  price: number;
  description?: string;
  image?: string | null;
  /**
   * Foto para la portada, si conviene otra que la de la tarjeta. Las fotos
   * apaisadas llevan en la tarjeta un recorte cuadrado con margen (para no
   * tapar el texto), que en la portada se vería chico.
   */
  heroImage?: string | null;
  /** Muestra "Precios desde" en vez de "Precio" (platos con varios tamaños). */
  priceFrom?: boolean;
  /** `false` = se ve en gris con la etiqueta "Agotado". */
  available?: boolean;
  /**
   * Ingredientes que el cliente puede pedir quitar. Si el plato los tiene, en
   * el carrito tiene que elegir "Con todo" o marcar qué quitar antes de poder
   * continuar el pedido.
   */
  removables?: string[];
}

export const RESTAURANT = {
  name: 'Gordos',
  tagline: 'Salchipapas sin culpa',
  /**
   * Color de la barra del navegador en el celular y de la marca de agua del
   * fondo. Usar el mismo que `--color-donzarco-ink` en `app/globals.css`.
   */
  themeColor: '#2a1008',
  /** Texto de la marca de agua del fondo (`null` = sin marca de agua). */
  watermark: 'GORDOS' as string | null,
  /** Logo PNG/WebP transparente, o `null` para usar el nombre en letra. */
  logo: null as string | null,
  /**
   * Fondo de la portada. Si ya trae el letrero con el nombre, poner
   * `heroShowName: false` para no repetirlo en letra.
   */
  heroBackground: '/menu/gordos/fondo-principal.webp' as string | null,
  heroShowName: false,
  /**
   * `true` si la pared de la portada es OSCURA (ladrillo, madera): el eslogan
   * pasa al color claro de marca para que se lea sobre ella.
   */
  heroDark: true,
  /**
   * Foto de portada a pantalla completa (la mesa llena de platos). Si está,
   * reemplaza a `heroBackground` + `heroDishes`.
   */
  cover: null as string | null,
  /** Platos que flotan en la portada (hasta 3: centro, izquierda, derecha). */
  heroDishes: ['salchi_crispy', 'salchi_clasica', 'salchi_espiral'],
  /** Horario en hora de Bolivia (24 h). */
  hours: { open: '16:00', close: '23:30' },
  /** WhatsApp con código de país, sin `+` ni espacios. */
  whatsapp: '59170000000',
  /** Enlace de Google Maps del local. */
  mapsUrl: 'https://maps.google.com/?q=Cochabamba,Bolivia',
  currency: 'Bs',

  /**
   * Nombre visible de cada categoría. El orden de las secciones es el de
   * `sectionOrder`; las categorías sin platos no se muestran.
   */
  categories: {
    plato: 'Salchipapas',
    extra: 'Extras',
    bebida: 'Bebidas',
  } satisfies Record<MenuCategory, string>,
  /** Bajada corta bajo el título de cada sección (opcional). */
  categoryTaglines: {
    plato: 'Papas recién fritas y salchicha a la plancha.',
    extra: 'Para que quede bien gordita.',
    bebida: 'Bien heladas, con mucho hielo.',
  } as Partial<Record<MenuCategory, string>>,
  sectionOrder: ['plato', 'extra', 'bebida'] as MenuCategory[],

  /**
   * El orden de esta lista es el orden en que salen en el menú.
   * `image: null` = todavía sin foto: la tarjeta deja el espacio con un
   * marcador y basta con poner la ruta cuando llegue el recorte.
   */
  products: [
    {
      code: 'salchi_clasica',
      name: 'Salchipapa Clásica',
      category: 'plato',
      price: 20,
      description:
        'Papas fritas crocantes con rodajas de salchicha a la plancha, baño de queso cheddar y perejil.',
      image: '/menu/gordos/salchi1-tarjeta.webp',
      heroImage: '/menu/gordos/salchi1.webp',
      removables: ['Queso cheddar', 'Perejil'],
    },
    {
      code: 'salchi_crispy',
      name: 'Salchipapa Crispy',
      category: 'plato',
      price: 28,
      description:
        'Salchicha y bocaditos de pollo crispy sobre papas fritas, con queso cheddar y salsa BBQ.',
      image: '/menu/gordos/salchi2-tarjeta.webp',
      heroImage: '/menu/gordos/salchi2.webp',
      removables: ['Queso cheddar', 'Salsa BBQ'],
    },
    {
      code: 'salchi_espiral',
      name: 'Salchipapa Espiral',
      category: 'plato',
      price: 25,
      description:
        'Salchicha en espiral dorada y rodajas a la plancha sobre papas fritas, con mostaza y salsa BBQ.',
      image: '/menu/gordos/salchi3-tarjeta.webp',
      heroImage: '/menu/gordos/salchi3.webp',
      removables: ['Mostaza', 'Salsa BBQ'],
    },
    {
      code: 'extra_tocino',
      name: 'Tocino Crocante',
      category: 'extra',
      price: 10,
      description: 'Tiras de tocino bien doradas. Súmalas a tu salchipapa o pícalas solas.',
      image: '/menu/gordos/tocino-tarjeta.webp',
    },
    {
      code: 'gordos_cola',
      name: 'Cola',
      category: 'bebida',
      price: 8,
      description: 'Vaso grande de cola con hielo.',
      image: '/menu/gordos/soda1.webp',
    },
    {
      code: 'gordos_lima',
      name: 'Soda de Lima',
      category: 'bebida',
      price: 8,
      description: 'Vaso grande de soda de lima-limón con hielo.',
      image: '/menu/gordos/soda2.webp',
    },
  ] satisfies DemoProduct[] as DemoProduct[],
};

/**
 * Los platos en el formato que espera el resto del sistema (`MenuItem`), para
 * que carrito y catálogo funcionen igual que con Supabase.
 */
export function demoMenuItems() {
  return RESTAURANT.products.map((p, i) => ({
    id: p.code,
    code: p.code,
    name: p.name,
    category: p.category,
    price: p.price,
    is_active: p.available !== false,
    sort_order: i,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }));
}

export function demoProduct(code: string): DemoProduct | undefined {
  return RESTAURANT.products.find((p) => p.code === code);
}
