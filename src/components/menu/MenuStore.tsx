'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { MenuItem } from '@/types';
import { useCart } from '@/lib/cart/use-cart';
import { usePromoCart } from '@/lib/cart/use-promo-cart';
import { useServerClock } from '@/lib/menu/use-server-clock';
import { unifiedTotals } from '@/lib/cart/promo-cart';
import { evaluatePromotion, isPurchasable, type Promotion } from '@/lib/promotions/promotion';
import { orderSectionsForMode, promoModeAt } from '@/lib/promotions/promo-mode';
import { filterMenuItems, groupByCategory, type CategoryFilter } from '@/lib/menu/catalog';
import { submitOrder } from '@/lib/checkout/client';
import { validateCheckoutForm, type CheckoutFormFields } from '@/lib/checkout/form';
import {
  INITIAL_CHECKOUT_STATE,
  canRetry as canRetryState,
  canSubmit as canSubmitState,
  checkoutReducer,
  isFrozen,
  isSessionBlocked,
} from '@/lib/checkout/state';
import { CartButton } from './CartButton';
import { CartPanel } from './CartPanel';
import { CategoryTabs } from './CategoryTabs';
import { CheckoutPanel } from './CheckoutPanel';
import { OrderSuccess } from './OrderSuccess';
import { ProductCard } from './ProductCard';
import { PromoCard } from './PromoCard';
import { FloatingActions } from './FloatingActions';
import { RESTAURANT, demoProduct } from '@/config/restaurant';
import {
  pendingChoices,
  preparationSummary,
  removeUnit,
  toggleConTodoGroup,
  toggleQuitarGroup,
  unitsOf,
  type Preparations,
} from '@/lib/cart/preparation';
import { formatMoney } from '@/lib/dashboard/format';

const NO_SESSION_NOTICE = 'Abre el menú desde WhatsApp para confirmar tu pedido.';
/** Pedidos nuevos pausados por saturación (0038, 14-09-2026). */
const ORDERS_PAUSED_NOTICE =
  'Estamos con demasiados pedidos y pausamos los nuevos por un rato. Vuelve a intentarlo en unos minutos.';
/** El enlace ya tiene un pedido: 201, 200 idempotente o 409. */
const SESSION_USED_NOTICE =
  'Este enlace ya fue utilizado. Vuelve a WhatsApp para solicitar un nuevo enlace y realizar otro pedido.';
/** El enlace no es válido o venció: 401. */
const SESSION_INVALID_NOTICE =
  'Este enlace ya no es válido. Vuelve a WhatsApp y solicita nuevamente el menú.';
/**
 * El enlace venía a CAMBIAR un pedido que ya está pagado (07-09-2026).
 *
 * Empieza por la buena noticia y a propósito: quien lee esto acaba de armar un
 * carrito que no va a poder mandar, y lo primero que necesita saber es que su
 * pedido no se perdió. Después, qué hacer con lo que quería añadir.
 *
 * No lo manda a hablar con nadie: al escribir por WhatsApp recibe el botón del
 * menú, que es exactamente lo que hace falta para el pedido nuevo.
 */
const ORDER_PAID_NOTICE =
  'Tu pedido anterior ya está pagado y en preparación, así que este enlace ya no puede ' +
  'cambiarlo. Escribinos por WhatsApp y armamos un pedido nuevo con lo que falte.';

/**
 * Tienda: catálogo, carrito y checkout.
 *
 * Los productos llegan ya leídos de Supabase por el Server Component. El
 * carrito vive en `localStorage`; el checkout, en un reducer puro
 * (`@/lib/checkout/state`) que concentra las guardas contra el doble envío y el
 * reintento tras un resultado ambiguo.
 *
 * `sessionToken` llega como prop y NO se guarda en el estado ni en
 * `localStorage`: solo se pasa a `submitOrder` en el momento del envío.
 */
export function MenuStore({
  items,
  promotions,
  serverNow,
  sessionToken,
  replacingOrder = null,
  ordersPaused = false,
  whatsappChatUrl = null,
  cartSessionId = null,
  demo = false,
}: {
  /**
   * Modo DEMO (sin Supabase ni Kapso): "Continuar pedido" arma el resumen y lo
   * abre en WhatsApp con el número de `config/restaurant`.
   */
  demo?: boolean;
  /**
   * La sesión del menú con que se abrió la página (19-09-2026), o `null` sin
   * enlace. El carrito guardado en el navegador solo se recupera con el mismo
   * enlace con que se armó: un enlace nuevo empieza vacío, y así no reaparece
   * lo que quedó a medias hace días.
   */
  cartSessionId?: string | null;
  /**
   * El chat de WhatsApp del negocio (`wa.me`), armado en el servidor. Es el
   * botón de la pantalla de "Pedido registrado"; `null` = número sin configurar.
   */
  whatsappChatUrl?: string | null;
  /**
   * ¿Pedidos nuevos pausados por saturación? (0038) Leído en el servidor. Se
   * puede mirar el menú y armar el carrito, pero no confirmar.
   */
  ordersPaused?: boolean;
  items: MenuItem[];
  /** Combos publicables, ya leídos en el servidor. */
  promotions: Promotion[];
  /**
   * Reloj del SERVIDOR en el momento de renderizar. Con él se decide si un
   * combo está vigente: el celular del cliente puede tener la hora mal, y una
   * promoción que vence a las 23:31 no puede depender de eso.
   *
   * `useServerClock` lo hace avanzar sumándole el tiempo transcurrido, para que
   * una pestaña abierta durante horas no se quede en el pasado.
   */
  serverNow: number;
  sessionToken: string | null;
  /**
   * El pedido que este enlace viene a CAMBIAR (0035), ya leído en el servidor.
   *
   * Cuando llega, el carrito se siembra con lo que el cliente había pedido para
   * que solo tenga que tocar lo que quiere cambiar. Ausente = enlace normal, y
   * entonces esta pantalla se comporta exactamente como siempre.
   */
  replacingOrder?: {
    orderNumber: string;
    items: Record<string, number>;
    promotions: Record<string, number>;
  } | null;
}) {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [cartOpen, setCartOpen] = useState(false);
  /** "Con todo" / qué quitar, por UNIDAD de cada plato. Ver `lib/cart/preparation`. */
  const [preparaciones, setPreparaciones] = useState<Preparations>({});

  /**
   * El alto REAL de la barra fija, publicado como `--menu-bar-h`
   * (EXPERIMENTAL, rediseno-menu-fastfood, 17-09-2026).
   *
   * Los encabezados de categoría se anclan justo debajo de la barra, así que
   * necesitan su alto. Escribirlo a mano como número mágico envejece mal: basta
   * que alguien cambie el padding del buscador para que los títulos queden
   * tapados a medias, y es de esas cosas que nadie vuelve a mirar.
   *
   * Medirlo en vivo lo mantiene correcto solo. `globals.css` trae un valor de
   * arranque para el primer render (aquí todavía no hay DOM que medir).
   */
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const barra = barRef.current;
    if (!barra) return;

    const publicar = () => {
      document.documentElement.style.setProperty('--menu-bar-h', `${barra.offsetHeight}px`);
    };
    publicar();

    // El alto cambia al rotar el teléfono o si el texto crece: no basta medirlo
    // una vez al montar.
    const observer = new ResizeObserver(publicar);
    observer.observe(barra);
    return () => observer.disconnect();
  }, []);

  // El instante del servidor, avanzando. Sin esto, una pestaña abierta desde
  // hace horas seguiría mostrando una promoción que ya venció.
  const ahora = useServerClock(serverNow);

  /**
   * ¿Noche de promoción? (14-09-2026). Ver `promotions/promo-mode`.
   *
   * Con el reloj del servidor, igual que las tarjetas de los combos: a las 00:00
   * la pestaña abierta vuelve sola al menú de siempre —orden, sueltos y
   * efectivo— sin recargar.
   */
  const modo = useMemo(() => promoModeAt(promotions, ahora), [promotions, ahora]);
  // `modo` es un objeto nuevo en cada tick del reloj. La lista de productos solo
  // tiene que rehacerse cuando cambia QUÉ se esconde, no cada 30 segundos.
  const soloEnCombo = [...modo.comboOnlyCodes].sort().join(',');

  /**
   * Lo que se puede VER: el catálogo menos lo que esta noche va solo en combo.
   *
   * El suelto se esconde en vez de pintarse "Agotado": no está agotado, está
   * dentro de la tarjeta de arriba, y un Trancapecho en gris debajo del combo de
   * Trancapechos haría pensar que el combo tampoco se puede pedir.
   */
  const visibles = useMemo(() => {
    const ocultos = new Set(soloEnCombo === '' ? [] : soloEnCombo.split(','));
    return ocultos.size === 0 ? items : items.filter((item) => !ocultos.has(item.code));
  }, [items, soloEnCombo]);

  /**
   * Lo que se puede COBRAR, que no es lo que se puede VER (07-09-2026).
   *
   * Desde que la vitrina enseña los agotados en gris, `items` trae también lo
   * que no está a la venta. El carrito no puede verlo: `calculateOrder` recorre
   * la lista que se le pasa y hace una línea de todo lo que tenga cantidad, así
   * que pasarle la lista entera resucitaría el producto agotado que quedó
   * guardado en el navegador del cliente — y se lo cobraría.
   *
   * El servidor lo rechazaría al crear el pedido (`orders/service` usa
   * `listActive`), pero eso es un error DESPUÉS de que el cliente lo dio por
   * pedido. La lista de aquí es la que evita llegar hasta ahí.
   *
   * Sale de `visibles` y no de `items`: el Trancapecho que quedó en el carrito
   * antes de la promoción tampoco puede cobrarse suelto esta noche.
   */
  const aLaVenta = useMemo(() => visibles.filter((item) => item.is_active), [visibles]);

  const cart = useCart(aLaVenta, cartSessionId);
  const promos = usePromoCart(promotions, ahora, cartSessionId);

  /**
   * El pedido que se está cambiando, de vuelta en el carrito (0035).
   *
   * ── Solo una vez, y solo sobre un carrito vacío ───────────────────────────
   *
   * Una vez, porque si no cada render devolvería el carrito a su estado
   * original y el cliente no podría quitar nada. Y solo si está vacío, porque
   * un carrito con cosas dentro es del cliente: ya lo retocó con este mismo
   * enlace —recargó, volvió a tocar el botón— y pisarle eso sería borrarle
   * trabajo. Lo que quedó de un enlace anterior no cuenta: el carrito es por
   * enlace (19-09-2026), así que aquí llega vacío.
   *
   * Se espera a `hydrated`: hasta entonces `cart.cart` está vacío por
   * construcción —el snapshot del servidor es siempre nulo— y sembrar ahí
   * pisaría el carrito guardado sin haberlo leído.
   */
  const sembrado = useRef(false);
  useEffect(() => {
    if (sembrado.current || !replacingOrder || !cart.hydrated) return;
    sembrado.current = true;

    const vacio =
      Object.keys(cart.cart).length === 0 && Object.keys(promos.state).length === 0;
    if (!vacio) return;

    cart.seed(replacingOrder.items);
    promos.seed(replacingOrder.promotions);
  }, [replacingOrder, cart, promos]);
  // TODO lo que se pinta —el botón, la cabecera, el resumen— sale de aquí. Dos
  // estados separados que se suman por su cuenta en cada pantalla producen el
  // fallo clásico: "0 productos, Bs 0,00" con un combo dentro.
  const unified = unifiedTotals(cart.summary, promos.summary);
  const [checkout, dispatch] = useReducer(checkoutReducer, INITIAL_CHECKOUT_STATE);

  /**
   * Segunda barrera contra el doble envío, además del reducer: cubre el caso de
   * dos toques en el mismo tick, antes de que React aplique el nuevo estado.
   */
  const inFlight = useRef(false);

  const modoActivo = modo.active;
  const groups = useMemo(
    () =>
      // En noche de promoción las bebidas suben debajo de Promociones: son lo
      // que acompaña al combo. A las 00:00 vuelve el orden de siempre.
      orderSectionsForMode(groupByCategory(filterMenuItems(visibles, category)), {
        active: modoActivo,
      }),
    [visibles, category, modoActivo],
  );

  /**
   * El formulario tal como se pinta y se envía.
   *
   * Sin efectivo, el método es QR y punto; sin recojo, la entrega es envío y
   * punto. Se DERIVA aquí en vez de escribirlo en el reducer con un efecto. Así
   * no hay un render con "Efectivo" o "Recojo" marcado en un formulario que ya
   * no lo ofrece, y a las 00:00 lo que el cliente había elegido sigue intacto.
   */
  const fields = useMemo(() => {
    let f = checkout.fields;
    if (!modo.cashAllowed && f.payment_method !== 'qr') f = { ...f, payment_method: 'qr' as const };
    if (!modo.pickupAllowed && f.delivery_type !== 'delivery') {
      f = { ...f, delivery_type: 'delivery' as const };
    }
    return f;
  }, [checkout.fields, modo.cashAllowed, modo.pickupAllowed]);

  const hasSession = sessionToken !== null;
  // El checkout solo está disponible con un enlace que aún no se haya bloqueado,
  // y con los pedidos nuevos abiertos (0038).
  const canCheckout = demo || (hasSession && !isSessionBlocked(checkout) && !ordersPaused);
  const frozen = isFrozen(checkout);
  const submitting = checkout.step === 'submitting';

  const cartNotice = ordersPaused
    ? ORDERS_PAUSED_NOTICE
    : checkout.sessionBlockReason === 'used'
      ? SESSION_USED_NOTICE
      : checkout.sessionBlockReason === 'invalid'
        ? SESSION_INVALID_NOTICE
        : checkout.sessionBlockReason === 'paid'
          ? ORDER_PAID_NOTICE
          : hasSession
            ? null
            : demo
              ? null
              : NO_SESSION_NOTICE;

  /** Combos vendibles AHORA, en el formato que espera el checkout. */
  const cartPromotions = useMemo(
    () =>
      promos.summary.lines.map((line) => ({
        promotion_id: line.promotionId,
        quantity: line.quantity,
        // La revisión que el cliente vio. Si cambió, el servidor lo rechaza en
        // vez de cobrarle una versión que no estaba mirando.
        revision: line.revision,
      })),
    [promos.summary.lines],
  );

  /** Líneas del carrito en el formato que espera el checkout. */
  const cartItems = useMemo(
    () =>
      cart.summary.lines.map((line) => ({
        code: line.product_code,
        quantity: line.quantity,
      })),
    [cart.summary.lines],
  );

  /**
   * Los platos del carrito que todavía no dicen cómo los quiere el cliente.
   * Con alguno pendiente no se puede continuar el pedido.
   */
  const pendientes = useMemo(
    () =>
      pendingChoices(
        cart.summary.lines.map((l) => ({ code: l.product_code, quantity: l.quantity })),
        preparaciones,
        (code) => demoProduct(code)?.removables,
      ),
    [cart.summary.lines, preparaciones],
  );
  const pendientesNombres = useMemo(
    () =>
      pendientes.map(
        (code) => cart.summary.lines.find((l) => l.product_code === code)?.product_name_snapshot ?? code,
      ),
    [pendientes, cart.summary.lines],
  );

  /**
   * El detalle de cada plato para la cocina, por código:
   * `lomito_completo → ["1 × Con todo", "1 × Sin tomate"]`.
   */
  const detallePorPlato = useMemo(
    () =>
      new Map(
        cart.summary.lines.map((l) => [
          l.product_code,
          preparationSummary(unitsOf(preparaciones, l.product_code, l.quantity)),
        ]),
      ),
    [cart.summary.lines, preparaciones],
  );

  /** "Lomito Completo: 1 × Con todo, 1 × Sin tomate", para las notas del pedido. */
  const preparacionTexto = useMemo(
    () =>
      cart.summary.lines
        .map((l) => {
          const detalle = detallePorPlato.get(l.product_code) ?? [];
          return detalle.length > 0 ? `${l.product_name_snapshot}: ${detalle.join(', ')}` : null;
        })
        .filter((t): t is string => t !== null),
    [cart.summary.lines, detallePorPlato],
  );

  // Las acciones reciben la cantidad ACTUAL del plato: la lista de unidades se
  // ajusta a ella antes de cambiar nada (ver `unitsOf`).
  const cantidadDe = useCallback((code: string) => cart.quantity(code), [cart]);

  const handleToggleConTodo = useCallback(
    (code: string, key: string) => {
      setPreparaciones((p) => toggleConTodoGroup(p, code, cantidadDe(code), key));
    },
    [cantidadDe],
  );
  const handleToggleQuitar = useCallback(
    (code: string, key: string, ingrediente: string) => {
      setPreparaciones((p) =>
        toggleQuitarGroup(p, code, cantidadDe(code), key, ingrediente, demoProduct(code)?.removables ?? []),
      );
    },
    [cantidadDe],
  );
  /** "− 1" de una fila: saca ESA unidad, no la última del plato. */
  const handleRemoveUnit = useCallback(
    (code: string, index: number) => {
      setPreparaciones((p) => removeUnit(p, code, cantidadDe(code), index));
      cart.remove(code);
    },
    [cantidadDe, cart],
  );

  /** Envía el pedido y traduce el resultado a acciones del reducer. */
  const send = useCallback(
    async (token: string, snapshot: Parameters<typeof submitOrder>[1]) => {
      inFlight.current = true;
      try {
        const result = await submitOrder(token, snapshot);

        if (result.ok) {
          dispatch({ type: 'SUCCESS', order: result.order, created: result.created });
          // Único punto de vaciado: solo tras 201 o 200 confirmados. Los dos
          // carritos, o el cliente vería su combo intacto tras pagarlo.
          cart.clear();
          promos.clear();
          setCartOpen(false);
          return;
        }

        dispatch({ type: 'FAILURE', failure: result.failure });
      } finally {
        inFlight.current = false;
      }
    },
    [cart, promos],
  );

  const handleSubmit = useCallback(() => {
    if (inFlight.current || submitting) return;
    if (!sessionToken) return;
    // Guarda explícita: el envío normal solo procede desde el formulario. No se
    // delega en que el reducer ignore SUBMIT, porque entonces `send` correría
    // igual y dispararía una petición sin transición de estado.
    if (!canSubmitState(checkout)) return;

    // `fields` y no `checkout.fields`: lo que se envía es lo que se ve.
    const validation = validateCheckoutForm(fields, cartItems, cartPromotions);
    if (!validation.ok) {
      dispatch({ type: 'VALIDATION_FAILED', errors: validation.errors });
      return;
    }

    dispatch({ type: 'SUBMIT', snapshot: validation.value });
    void send(sessionToken, validation.value);
  }, [cartItems, cartPromotions, checkout, fields, sessionToken, submitting, send]);

  const handleRetry = useCallback(() => {
    if (inFlight.current || submitting) return;
    if (!sessionToken || !checkout.snapshot) return;
    if (!canRetryState(checkout)) return;

    // Se reenvía la fotografía guardada, nunca el carrito actual: si el pedido
    // ya se creó, el fingerprint coincide y el backend responde 200.
    dispatch({ type: 'RETRY' });
    void send(sessionToken, checkout.snapshot);
  }, [checkout, sessionToken, submitting, send]);

  const handleFieldChange = useCallback((field: keyof CheckoutFormFields, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const handleOpenCheckout = useCallback(() => {
    if (!canCheckout || pendientes.length > 0) return;
    if (demo) {
      const lineas = cart.summary.lines.map((l) => {
        const base = `• ${l.quantity} × ${l.product_name_snapshot} — ${formatMoney(l.subtotal)}`;
        const detalle = detallePorPlato.get(l.product_code) ?? [];
        return [base, ...detalle.map((d) => `   ↳ ${d}`)].join('\n');
      });
      const texto = [
        `¡Hola ${RESTAURANT.name}! Quiero hacer este pedido:`,
        '',
        ...lineas,
        '',
        `Total: ${formatMoney(unified.total)}`,
      ].join('\n');
      window.open(`https://wa.me/${RESTAURANT.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank');
      return;
    }
    dispatch({ type: 'OPEN_FORM' });
    // Con pedido real, la elección viaja en las notas para la cocina. Solo si
    // el cliente no escribió nada: no se le pisa lo que ya puso.
    if (preparacionTexto.length > 0 && checkout.fields.notes.trim() === '') {
      dispatch({ type: 'SET_FIELD', field: 'notes', value: preparacionTexto.join('. ') });
    }
  }, [
    canCheckout,
    pendientes.length,
    demo,
    cart.summary.lines,
    unified.total,
    detallePorPlato,
    preparacionTexto,
    checkout.fields.notes,
  ]);

  const handleBackToCart = useCallback(() => {
    dispatch({ type: 'CLOSE' });
    setCartOpen(true);
  }, []);

  const handleCloseCheckout = useCallback(() => {
    dispatch({ type: 'CLOSE' });
  }, []);

  /**
   * Las promociones que se pueden comprar AHORA.
   *
   * El filtro se hace aquí y no en el servidor porque el estado depende del
   * reloj: una promoción que vence a mitad de la sesión deja de mostrarse sin
   * recargar. Y como el instante es el del servidor, no lo decide el celular.
   */
  const vendibles = useMemo(
    () =>
      promotions
        .map((promotion) => ({ promotion, pricing: evaluatePromotion(promotion, ahora) }))
        .filter(({ pricing }) => isPurchasable(pricing)),
    [promotions, ahora],
  );

  const hasResults = groups.length > 0;
  const checkoutOpen = checkout.step === 'form' || checkout.step === 'submitting' || checkout.step === 'failed';
  const showCartButton =
    cart.hydrated && unified.units > 0 && !cartOpen && !checkoutOpen && checkout.step !== 'success';

  return (
    <>
      {/* Barra fija: fondo a todo el ancho, contenido centrado con el catálogo.
          Azul marino del logo, con la franja de la bandera como borde. */}
      <div
        ref={barRef}
        className="sticky top-0 z-20 bg-donzarco-ink/95 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 shadow-lg shadow-donzarco-ink/30 backdrop-blur-md after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-[linear-gradient(90deg,var(--menu-stripe-a)_0_33%,var(--menu-stripe-b)_33%_66%,var(--menu-stripe-a)_66%)]"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-5">
          <a href="#top" className="shrink-0" aria-label="Volver al inicio">
            {RESTAURANT.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={RESTAURANT.logo} alt={RESTAURANT.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-[var(--menu-orange)]/70" />
            ) : (
              <span className="font-display text-2xl leading-none text-white">{RESTAURANT.name}</span>
            )}
          </a>
          <div className="min-w-0 flex-1">
            <CategoryTabs active={category} onChange={setCategory} />
          </div>
        </div>
      </div>

      <div id="menu" className="scroll-mt-4 pb-40">
        {/* Antes del catálogo y solo si hay algo que ofrecer. Sin promociones
            vendibles no se pinta ni el encabezado: una sección vacía titulada
            "PROMOCIONES" promete algo que no existe. */}
        {vendibles.length > 0 && (
          <section aria-label="Promociones" className="mx-auto max-w-6xl px-4">
            <SectionHeader label="Promociones" tone="promo" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {vendibles.map(({ promotion, pricing }) => (
                <PromoCard
                  key={promotion.id}
                  promotion={promotion}
                  pricing={pricing}
                  quantity={promos.quantity(promotion.id)}
                  now={ahora}
                  onAdd={() => promos.add(promotion.id)}
                  onRemove={() => promos.remove(promotion.id)}
                />
              ))}
            </div>
          </section>
        )}

        {hasResults ? (
          groups.map((group, index) => (
            // `overflow-x-clip` recorta las fotos que se salen de la tarjeta hacia
            // el borde de la pantalla SIN crear un contenedor de scroll: con
            // `overflow-hidden` el encabezado `sticky` dejaría de anclarse.
            <section key={group.category} id={`seccion-${group.category}`} aria-label={group.label} className={`relative scroll-mt-[var(--menu-bar-h)] overflow-x-clip ${index > 0 ? 'pt-4' : ''}`}>
              <SectionHeader label={group.label} tagline={RESTAURANT.categoryTaglines[group.category]} />
              {/* Móvil: 1 columna. Tablet: 2. Desktop amplio: 3. */}
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-8 gap-y-3 px-4 pb-8 sm:grid-cols-2 sm:px-8 xl:grid-cols-3">
                {group.items.map((item, i) => (
                  <ProductCard
                    key={item.code}
                    flip={i % 2 === 1}
                    item={item}
                    quantity={cart.quantity(item.code)}
                    onAdd={() => cart.add(item.code)}
                    onRemove={() => cart.remove(item.code)}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <p className="mx-4 mt-6 rounded-3xl bg-donzarco-ink/80 px-4 py-10 text-center text-sm text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
            {/* Sin buscador (17-09-2026) esto ya solo puede pasar si la
                categoría elegida quedó sin nada que ofrecer. */}
            Por ahora no hay nada en esta categoría. Elige otra.
          </p>
        )}
      </div>

      {showCartButton ? (
        <CartButton
          units={unified.units}
          total={unified.total}
          onOpen={() => setCartOpen(true)}
        />
      ) : null}

      <FloatingActions raised={showCartButton} />

      <CartPanel
        open={cartOpen && unified.units > 0 && !checkoutOpen && checkout.step !== 'success'}
        summary={cart.summary}
        promoSummary={promos.summary}
        items={items}
        now={ahora}
        onClose={() => setCartOpen(false)}
        onAdd={cart.add}
        onRemove={cart.remove}
        onAddPromo={promos.add}
        onRemovePromo={promos.remove}
        onContinue={handleOpenCheckout}
        canCheckout={canCheckout}
        checkoutNotice={cartNotice}
        preparations={preparaciones}
        onToggleConTodo={handleToggleConTodo}
        onToggleQuitar={handleToggleQuitar}
        onRemoveUnit={handleRemoveUnit}
        pendingNames={pendientesNombres}
      />

      <CheckoutPanel
        open={checkoutOpen}
        fields={fields}
        cashAllowed={modo.cashAllowed}
        pickupAllowed={modo.pickupAllowed}
        errors={checkout.errors}
        summary={cart.summary}
        promoSummary={promos.summary}
        submitting={submitting}
        frozen={frozen}
        failure={checkout.failure}
        canRetry={canRetryState(checkout)}
        canSubmit={canSubmitState(checkout)}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        onBackToCart={handleBackToCart}
        onClose={handleCloseCheckout}
      />

      {checkout.step === 'success' && checkout.order ? (
        <OrderSuccess order={checkout.order} whatsappChatUrl={whatsappChatUrl} />
      ) : null}
    </>
  );
}

/**
 * Encabezado de categoría, anclado mientras dura su sección (EXPERIMENTAL,
 * rediseno-menu-fastfood, 17-09-2026).
 *
 * ── El arrastre y el empujón son de CSS, no de JavaScript ───────────────────
 *
 * Antes era texto suelto que se perdía al primer deslizamiento: a media lista
 * uno ya no sabía si seguía en Platos o en Bebidas. Ahora cada encabezado es
 * `sticky` DENTRO de su propia `<section>`, y ahí está todo el truco:
 *
 *   - mientras se recorre su sección, se queda clavado bajo la barra;
 *   - cuando la sección se acaba, su propio borde inferior lo empuja hacia
 *     arriba, y el encabezado de la siguiente ocupa el lugar.
 *
 * No hace falta escuchar el scroll ni medir posiciones: el navegador lo hace
 * solo porque el contenedor que lo limita es su sección. Por eso importa que
 * ningún ancestro entre la sección y aquí tenga `overflow` distinto de
 * `visible` — eso rompería el anclaje sin decir nada (ver `page.tsx`, que
 * evita `overflow-hidden` en el `<main>` a propósito).
 *
 * `z-10` contra el `z-20` de la barra: al ser empujado, el encabezado pasa por
 * DEBAJO del vidrio del buscador en vez de encima.
 */
function SectionHeader({
  label,
  tagline,
  tone = 'catalogo',
}: {
  label: string;
  tagline?: string;
  tone?: 'catalogo' | 'promo';
}) {
  // La banda azul nace del borde izquierdo de la pantalla y se desvanece hacia
  // la derecha, con la franja de la bandera abajo. El degradado de papel de
  // detrás tapa las tarjetas que pasan por debajo mientras está anclada.
  return (
    <h2
      className={`sticky top-[var(--menu-bar-h)] z-10 bg-[linear-gradient(to_bottom,var(--menu-bg)_78%,transparent)] pt-3 pb-5 ${
        tone === 'promo' ? '-mx-4' : ''
      }`}
    >
      <span className="relative block w-[88%] max-w-xl rounded-r-2xl bg-gradient-to-r from-donzarco-ink via-donzarco-ink/95 to-donzarco-ink/0 py-2 pr-16 pl-4 shadow-lg shadow-donzarco-ink/20 sm:pl-8">
        <span className="font-display block text-3xl leading-tight text-[var(--menu-cream)] drop-shadow-[0_2px_0_rgba(0,0,0,0.35)] sm:text-4xl">
          {label}
        </span>
        {tagline ? (
          <span className="font-body block text-xs font-medium text-[var(--menu-cream)]/75">{tagline}</span>
        ) : null}
        <span className="menu-stripe absolute inset-x-0 -bottom-1 h-1.5 rounded-r-full [mask-image:linear-gradient(90deg,black_60%,transparent)]" aria-hidden />
      </span>
    </h2>
  );
}
