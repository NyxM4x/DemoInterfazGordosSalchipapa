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

/** Lo que se puede quitar a los sándwiches de la casa. */
const QUITABLES_SANDWICH = ['Tomate', 'Lechuga', 'Ensalada', 'Queso'];

export const RESTAURANT = {
  name: 'La Milonguita',
  tagline: 'Comer rico hace bien',
  /**
   * Color de la barra del navegador en el celular y de la marca de agua del
   * fondo. Usar el mismo que `--color-donzarco-ink` en `app/globals.css`.
   */
  themeColor: '#0b1630',
  /** Texto de la marca de agua del fondo (`null` = sin marca de agua). */
  watermark: 'LA MILONGUITA' as string | null,
  /** Logo PNG/WebP transparente, o `null` para usar el nombre en letra. */
  logo: '/menu/milonguita/logo.webp' as string | null,
  /**
   * Fondo de la portada. Si ya trae el letrero con el nombre, poner
   * `heroShowName: false` para no repetirlo en letra.
   */
  heroBackground: '/menu/milonguita/fondo-principal.webp' as string | null,
  heroShowName: false,
  /**
   * Foto de portada a pantalla completa (la mesa llena de platos). Si está,
   * reemplaza a `heroBackground` + `heroDishes`.
   */
  cover: null as string | null,
  /** Platos que flotan en la portada (hasta 3: centro, izquierda, derecha). */
  heroDishes: ['lomito_completo', 'choripan', 'milanesa'],
  /** Horario en hora de Bolivia (24 h). */
  hours: { open: '11:00', close: '23:00' },
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
    plato: 'Sándwiches',
    extra: 'Extras',
    bebida: 'Refrescos',
  } satisfies Record<MenuCategory, string>,
  /** Bajada corta bajo el título de cada sección (opcional). */
  categoryTaglines: {
    plato: 'Del carrito a tu mano, recién hechos.',
    extra: 'Súmale lo que quieras.',
    bebida: 'Bien helados, con hielo y fruta.',
  } as Partial<Record<MenuCategory, string>>,
  sectionOrder: ['plato', 'extra', 'bebida'] as MenuCategory[],

  /**
   * El orden de esta lista es el orden en que salen en el menú.
   * `image: null` = todavía sin foto: la tarjeta deja el espacio con un
   * marcador y basta con poner la ruta cuando llegue el recorte.
   */
  products: [
    {
      code: 'lomito_completo',
      name: 'Lomito Completo',
      category: 'plato',
      price: 35,
      description:
        'Lomo de res a la plancha, queso fundido, tomate, lechuga y mayonesa casera en pan de campo tostado.',
      image: '/menu/milonguita/lomito.webp',
      removables: QUITABLES_SANDWICH,
    },
    {
      code: 'choripan',
      name: 'Choripanes',
      category: 'plato',
      price: 30,
      description:
        'Dos choripanes de chorizo a la parrilla en pan crocante, con chimichurri de la casa y salsa criolla.',
      image: '/menu/milonguita/choripan.webp',
      removables: QUITABLES_SANDWICH,
    },
    {
      code: 'milanesa',
      name: 'Sándwich de Milanesa',
      category: 'plato',
      price: 38,
      description:
        'Milanesa de carne bien crocante con jamón, queso, huevo, lechuga y tomate. Desborda el pan.',
      image: '/menu/milonguita/milanesa.webp',
      removables: QUITABLES_SANDWICH,
    },
    {
      code: 'papas_fritas',
      name: 'Papas Fritas',
      category: 'extra',
      price: 12,
      description: 'Bolsa de papas doradas y crocantes, con sal. Para acompañar o picar solas.',
      image: '/menu/milonguita/papas.webp',
    },
    {
      code: 'vaso_limon',
      name: 'Limonada',
      category: 'bebida',
      price: 10,
      description: 'Vaso grande con hielo, limón exprimido y hojas de menta.',
      image: '/menu/milonguita/vaso-limon.webp',
    },
    {
      code: 'jugo_maracuya',
      name: 'Jugo de Maracuyá',
      category: 'bebida',
      price: 10,
      description: 'Vaso grande con hielo, maracuyá natural y sus semillas.',
      image: '/menu/milonguita/vaso-maracuya.webp',
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
