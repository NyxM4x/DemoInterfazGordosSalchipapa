/**
 * Marca de agua del fondo del menú: el nombre del restaurante repetido en
 * diagonal, como un empapelado. Devuelve el valor de `--menu-watermark`, que
 * lee `.menu-paper` en `app/globals.css`.
 *
 * Es un SVG en línea: ninguna petición de red. El SVG no puede usar las fuentes
 * web de la página, por eso va en una sans gruesa del sistema. El mosaico mide
 * 300×110 (el `background-size` de `.menu-paper`); con más de ~16 letras el
 * texto se achica para no cortarse en el borde.
 */
export function watermarkBackground(text: string, color: string): string {
  const size = Math.min(24, Math.floor(380 / Math.max(text.length, 1)));
  const escapado = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='110' viewBox='0 0 300 110'>` +
    `<text x='150' y='64' text-anchor='middle' transform='rotate(-10 150 55)' fill='${color}' ` +
    `fill-opacity='0.05' font-family='Arial Black,Arial,sans-serif' font-weight='900' ` +
    `font-size='${size}'>${escapado}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
