'use client';

import { RESTAURANT } from '@/config/restaurant';

/**
 * Botones flotantes: ubicación (izquierda) y WhatsApp (derecha).
 * `raised` los sube cuando el botón del carrito ocupa el pie de la pantalla.
 */
export function FloatingActions({ raised }: { raised: boolean }) {
  const bottom = raised
    ? 'bottom-[calc(6.5rem+env(safe-area-inset-bottom))]'
    : 'bottom-[max(1.25rem,env(safe-area-inset-bottom))]';

  return (
    <>
      <a
        href={RESTAURANT.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Cómo llegar a ${RESTAURANT.name}`}
        className={`fixed left-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-donzarco-ink text-[var(--menu-orange)] shadow-lg shadow-donzarco-ink/40 ring-2 ring-[var(--menu-orange)]/60 transition-all active:scale-90 ${bottom}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
      </a>
      <a
        href={`https://wa.me/${RESTAURANT.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Escribir a ${RESTAURANT.name} por WhatsApp`}
        className={`fixed right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-donzarco-ink/40 transition-all active:scale-90 ${bottom}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z" />
        </svg>
      </a>
    </>
  );
}
