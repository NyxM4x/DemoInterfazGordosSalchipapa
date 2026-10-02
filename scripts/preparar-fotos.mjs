/**
 * Prepara las fotos de un restaurante para el menú, todas con el mismo formato:
 *
 *   - Productos (PNG con fondo transparente): recorta el espacio vacío, centra
 *     el producto en 800×800 con un margen de 32 px y lo guarda en WebP. Así
 *     todas las tarjetas tienen el mismo tamaño y nada toca el borde.
 *   - Portada (`--portada archivo`): solo la pasa a WebP liviano.
 *   - Logo (`--logo archivo`): lo recorta en CÍRCULO (quita esquinas negras o
 *     blancas) y lo guarda en 512×512 como `logo.webp`.
 *
 * Uso (desde la raíz del proyecto):
 *
 *   npm run fotos -- public/menu/mi-local
 *   npm run fotos -- public/menu/mi-local --portada fondo.jpg --logo logo.png
 *
 * Toma TODOS los .png de la carpeta (menos el logo) y escribe al lado el .webp
 * con el mismo nombre: `lomito.png` → `lomito.webp`. Después basta con poner la
 * ruta en `src/config/restaurant.ts`. Los originales no se tocan.
 */
import { readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const carpeta = args.find((a) => !a.startsWith('--') && !esValorDeOpcion(a));
const portada = opcion('--portada');
const logo = opcion('--logo');

if (!carpeta) {
  console.error('Uso: npm run fotos -- <carpeta> [--portada archivo] [--logo archivo]');
  process.exit(1);
}

function opcion(nombre) {
  const i = args.indexOf(nombre);
  return i >= 0 ? args[i + 1] : undefined;
}

function esValorDeOpcion(valor) {
  const i = args.indexOf(valor);
  return i > 0 && args[i - 1].startsWith('--');
}

const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };
const LADO = 800;
const MARGEN = 32;

async function producto(archivo) {
  const salida = join(carpeta, `${basename(archivo, extname(archivo))}.webp`);
  const recortado = await sharp(join(carpeta, archivo)).trim({ threshold: 10 }).toBuffer();
  await sharp(recortado)
    .resize(LADO - 2 * MARGEN, LADO - 2 * MARGEN, { fit: 'contain', background: TRANSPARENTE })
    .extend({ top: MARGEN, bottom: MARGEN, left: MARGEN, right: MARGEN, background: TRANSPARENTE })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(salida);
  console.log(`producto  ${archivo} → ${salida}`);
}

async function fotoPortada(archivo) {
  const salida = join(carpeta, 'fondo-principal.webp');
  await sharp(join(carpeta, archivo)).webp({ quality: 80 }).toFile(salida);
  console.log(`portada   ${archivo} → ${salida}`);
}

/** Busca el círculo del logo: el primer píxel "no fondo" desde cada borde. */
async function fotoLogo(archivo) {
  const entrada = join(carpeta, archivo);
  const { data, info } = await sharp(entrada).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const fondo = brillo(data, W, 0, 0);
  const esFondo = (x, y) => Math.abs(brillo(data, W, x, y) - fondo) < 60;
  const fila = H >> 1;
  const col = W >> 1;
  let izq = 0;
  while (izq < W - 1 && esFondo(izq, fila)) izq++;
  let der = W - 1;
  while (der > 0 && esFondo(der, fila)) der--;
  let arr = 0;
  while (arr < H - 1 && esFondo(col, arr)) arr++;
  let aba = H - 1;
  while (aba > 0 && esFondo(col, aba)) aba--;

  const cx = Math.round((izq + der) / 2);
  const cy = Math.round((arr + aba) / 2);
  // El radio más chico que entra en la imagen: el círculo nunca se sale.
  const r = Math.min(der - izq, aba - arr, 2 * cx, 2 * cy, 2 * (W - cx), 2 * (H - cy)) >> 1;
  const mascara = Buffer.from(
    `<svg width="${2 * r}" height="${2 * r}"><circle cx="${r}" cy="${r}" r="${r}"/></svg>`,
  );
  const cuadrado = await sharp(entrada)
    .extract({ left: cx - r, top: cy - r, width: 2 * r, height: 2 * r })
    .ensureAlpha()
    .toBuffer();
  const redondo = await sharp(cuadrado).composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
  const salida = join(carpeta, 'logo.webp');
  await sharp(redondo).resize(512, 512).webp({ quality: 88 }).toFile(salida);
  console.log(`logo      ${archivo} → ${salida}`);
}

function brillo(data, W, x, y) {
  const i = (y * W + x) * 3;
  return data[i] + data[i + 1] + data[i + 2];
}

const productos = readdirSync(carpeta).filter(
  (f) => extname(f).toLowerCase() === '.png' && f !== logo,
);
for (const archivo of productos) await producto(archivo);
if (portada) await fotoPortada(portada);
if (logo) await fotoLogo(logo);
console.log('Listo. Pon las rutas /menu/... en src/config/restaurant.ts');
