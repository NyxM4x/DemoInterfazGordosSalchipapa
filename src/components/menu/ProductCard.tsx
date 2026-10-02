'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { MenuItem } from '@/types';
import { RESTAURANT, demoProduct } from '@/config/restaurant';
import { productDescription, productImage } from '@/lib/menu/catalog';
import { QuantityControl } from './QuantityControl';

/** `90` → "90"; `12.5` → "12,50". Sin decimales cuando el precio es entero. */
function precio(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
}

/**
 * Tarjeta de plato: tarjeta oscura de marca con la foto recortada
 * SALIENDO por un costado —hasta el borde de la pantalla—, y al otro lado el
 * nombre, la descripción, el precio y el botón +.
 *
 * `flip` alterna el lado de la foto entre tarjetas, para que la lista no sea
 * una columna monótona. El resplandor ámbar de la tarjeta sigue a la foto.
 *
 * Sin foto todavía (`image: null`), el espacio queda reservado con un marcador
 * discreto: la tarjeta ya tiene su forma final y solo falta poner el recorte.
 *
 * El carrito funciona igual que antes: + agrega, y con el plato ya en el
 * carrito el botón pasa a ser el control − cantidad +.
 */
export function ProductCard({
  item,
  quantity,
  onAdd,
  onRemove,
  flip = false,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  /** Foto a la derecha en vez de a la izquierda. */
  flip?: boolean;
}) {
  const description = productDescription(item.code);
  const available = item.is_active;
  const inCart = quantity > 0;
  const image = productImage(item);
  const src = image.src;
  const priceFrom = demoProduct(item.code)?.priceFrom ?? false;

  return (
    <article
      className={`relative z-0 menu-card my-4 flex min-h-[13.5rem] rounded-[1.75rem] py-5 shadow-xl shadow-donzarco-ink/35 ring-1 transition-shadow ${
        flip ? 'flex-row-reverse pl-5' : 'pr-5'
      } ${inCart ? 'ring-2 ring-[var(--menu-orange)]' : 'ring-white/5'} ${
        available ? '' : 'opacity-60 grayscale'
      }`}
      style={{ '--glow-x': flip ? '85%' : '15%' } as CSSProperties}
    >
      {/* Columna de la foto: reserva el espacio; la foto se sale de ella. */}
      <div className="relative w-[44%] shrink-0">
        <div
          className={`absolute top-1/2 aspect-square w-[150%] -translate-y-1/2 ${
            flip ? '-right-[38%]' : '-left-[38%]'
          }`}
        >
          {src ? (
            <Image
              src={src}
              alt={item.name}
              fill
              sizes="(min-width: 1280px) 260px, (min-width: 640px) 32vw, 62vw"
              className="object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.55)]"
            />
          ) : (
            <span
              className="absolute inset-[16%] flex flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-[var(--menu-cream)]/25 bg-white/5 text-6xl"
              aria-hidden
            >
              {image.emoji}
              <span className="font-body text-[10px] font-semibold tracking-[0.2em] text-[var(--menu-cream)]/50 uppercase">
                Foto pronto
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-display text-[1.6rem] leading-[1.1] text-[var(--menu-cream)] drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">
          {item.name}
        </h3>
        <div className="menu-stripe mt-2 h-1 w-12 rounded-full opacity-90" aria-hidden />

        {description ? (
          <p className="font-body mt-2 text-[13px] leading-snug text-[var(--menu-cream)]/80">{description}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="flex flex-col leading-none">
            <span className="font-body text-[11px] font-bold tracking-[0.12em] text-[var(--menu-orange)] uppercase">
              {priceFrom ? 'Precios desde' : 'Precio'}
            </span>
            <span className="font-price mt-1 text-4xl text-white tabular-nums">
              <span className="mr-1 text-xl">{RESTAURANT.currency}</span>
              {precio(item.price)}
            </span>
          </p>

          {!available ? (
            <span className="font-body rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/20">
              Agotado
            </span>
          ) : inCart ? (
            <QuantityControl
              name={item.name}
              quantity={quantity}
              onAdd={onAdd}
              onRemove={onRemove}
              size="sm"
              tone="inverse"
            />
          ) : (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Agregar ${item.name} al carrito`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--menu-orange)] text-3xl leading-none font-semibold text-donzarco-ink shadow-lg shadow-black/40 ring-4 ring-[var(--menu-orange)]/20 transition-transform active:scale-90"
            >
              +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
