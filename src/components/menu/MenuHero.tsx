'use client';

import Image from 'next/image';
import { RESTAURANT, demoProduct } from '@/config/restaurant';
import { useServerClock } from '@/lib/menu/use-server-clock';

/** Minutos del día en hora de Bolivia (UTC-4, sin horario de verano). */
function minutosBolivia(now: number): number {
  const d = new Date(now - 4 * 60 * 60 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

/**
 * Portada del menú: el letrero del local arriba, los platos estrella flotando
 * debajo, el estado abierto/cerrado y el botón "Ver menú".
 * Todo sale de `config/restaurant`.
 *
 * Pensada para un fondo CLARO (una pared con el letrero): sin velo negro, que
 * dejaría la pared gris, y con los textos en el color oscuro de marca. Con una
 * pared oscura, `heroDark` pasa el eslogan al color claro de marca. El
 * degradado de la portada usa `--menu-hero-top/mid` (el color de la pared de
 * la foto) para que la foto se funda sin que se note su borde.
 */
export function MenuHero({ serverNow }: { serverNow: number }) {
  const ahora = useServerClock(serverNow);
  const min = minutosBolivia(ahora);
  const abierto = min >= aMinutos(RESTAURANT.hours.open) && min < aMinutos(RESTAURANT.hours.close);

  return (
    <header className="relative flex min-h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-[var(--menu-hero-top)] via-[var(--menu-hero-mid)] to-[var(--menu-bg)] text-donzarco-ink">
      {RESTAURANT.cover ? (
        <Image
          src={RESTAURANT.cover}
          alt={`Platos de ${RESTAURANT.name}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : null}

      <p
        role="status"
        className="menu-fade-up absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-10 mx-auto flex w-fit items-center gap-2 rounded-full bg-donzarco-ink/85 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-black/20 ring-1 ring-white/10 backdrop-blur-md"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${abierto ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500'}`}
          aria-hidden
        />
        {abierto
          ? `Abierto hasta las ${RESTAURANT.hours.close}`
          : `Cerrado · Abrimos a las ${RESTAURANT.hours.open}`}
      </p>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col pb-8 sm:max-w-xl">
        {RESTAURANT.cover ? <div className="flex-1" /> : <PortadaConPlatos />}

        <div className="menu-fade-up px-4 text-center [animation-delay:150ms]">
          <h1 className="sr-only">{RESTAURANT.name}</h1>
          {!RESTAURANT.heroShowName ? null : RESTAURANT.logo ? (
            <Image
              src={RESTAURANT.logo}
              alt={RESTAURANT.name}
              width={512}
              height={512}
              className="mx-auto h-28 w-auto object-contain drop-shadow-[0_6px_14px_rgba(11,22,48,0.35)]"
            />
          ) : (
            <p className="font-display text-6xl leading-none" aria-hidden>
              {RESTAURANT.name}
            </p>
          )}
          <p
            className={`font-display text-3xl leading-tight sm:text-4xl ${
              RESTAURANT.heroDark
                ? 'text-[var(--menu-cream)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
                : 'text-donzarco-ink'
            }`}
          >
            {RESTAURANT.tagline}
          </p>
          <div className="menu-stripe mx-auto mt-3 h-1.5 w-24 rounded-full shadow-sm" aria-hidden />
        </div>

        <a
          href="#menu"
          className="menu-fade-up font-display mx-auto mt-6 rounded-full bg-donzarco-ink px-10 py-3 text-2xl text-[var(--menu-orange)] shadow-xl shadow-donzarco-ink/30 ring-2 ring-[var(--menu-orange)]/60 transition-transform [animation-delay:450ms] active:scale-95"
        >
          Ver menú
        </a>
      </div>
    </header>
  );
}

/**
 * Portada sin foto completa: el fondo (`heroBackground`, la pared con el
 * letrero) y debajo los recortes de `heroDishes` flotando sobre un resplandor
 * cálido —la luz del carrito—, que es lo que los hace "salir" de la pantalla.
 *
 * El fondo va a lo ANCHO y se funde hacia abajo con la pared; en pantallas
 * anchas además se desvanece por los costados para que no se vea el borde de
 * la foto. Los platos se montan encima del tercio inferior de la foto.
 */
function PortadaConPlatos() {
  const platos = RESTAURANT.heroDishes
    .map((code) => demoProduct(code))
    .map((p) => p && { ...p, image: p.heroImage ?? p.image })
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.image))
    .slice(0, 3);
  const [centro, izq, der] = platos;
  const sombra = 'object-contain drop-shadow-[0_20px_18px_rgba(11,22,48,0.38)]';

  return (
    <div className="relative" aria-hidden>
      {RESTAURANT.heroBackground ? (
        <div className="relative aspect-[1008/1059] w-full [mask-image:linear-gradient(to_bottom,black_62%,transparent_96%)] sm:[mask-image:radial-gradient(ellipse_60%_62%_at_50%_42%,black_62%,transparent_100%)]">
          <Image
            src={RESTAURANT.heroBackground}
            alt=""
            fill
            priority
            sizes="(min-width: 640px) 576px, 100vw"
            className="object-cover object-top"
          />
        </div>
      ) : (
        <div className="h-24" />
      )}

      {/* Los platos suben sobre la parte baja (vacía) de la pared. */}
      <div className="relative -mt-[46%] aspect-[5/4] w-full">
        {/* Resplandor cálido y sombra de apoyo del plato central. */}
        <div className="absolute inset-x-[8%] top-[18%] bottom-[6%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,170,50,0.55),rgba(245,170,50,0.18)_45%,transparent_70%)] blur-xl" />
        <div className="absolute inset-x-[22%] bottom-[4%] h-[9%] rounded-[50%] bg-donzarco-ink/25 blur-lg" />

        {izq && (
          <div className="menu-float absolute top-[2%] -left-[9%] h-[58%] w-[56%] -rotate-6 [animation-delay:-1.2s]">
            <Image src={izq.image!} alt="" fill sizes="55vw" priority className={sombra} />
          </div>
        )}
        {der && (
          <div className="menu-float absolute top-[2%] -right-[9%] h-[58%] w-[56%] rotate-6 [animation-delay:-2.4s]">
            <Image src={der.image!} alt="" fill sizes="55vw" priority className={sombra} />
          </div>
        )}
        {centro && (
          <div className="menu-float absolute bottom-[4%] left-[12%] h-[78%] w-[76%]">
            <Image src={centro.image!} alt="" fill sizes="80vw" priority className={sombra} />
          </div>
        )}
      </div>
    </div>
  );
}
