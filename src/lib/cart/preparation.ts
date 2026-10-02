/**
 * Cómo quiere el cliente cada UNIDAD de un plato: "con todo" o quitándole
 * ingredientes.
 *
 * ── Por unidad, no por plato ─────────────────────────────────────────────
 *
 * Dos lomitos pueden salir distintos: uno con todo y otro sin tomate. Por eso
 * se guarda una preparación por unidad, y en pantalla las unidades iguales se
 * agrupan en una fila ("Con todo × 2", "Sin tomate × 1").
 *
 * Al quitar un ingrediente en una fila de varias unidades, se SEPARA una sola
 * unidad con ese cambio y las demás quedan marcadas "Con todo" (o como
 * estaban, si ya tenían otra elección). Así el cliente arma "1 con todo + 1
 * sin tomate" con un solo toque, y si quiere otro distinto repite sobre la
 * fila de "Con todo".
 *
 * ── Obligatorio ──────────────────────────────────────────────────────────
 *
 * En los platos con ingredientes quitables, cada unidad tiene que tener
 * elección antes de continuar: la cocina nunca recibe un lomito sin saber si
 * va con tomate.
 *
 * Vive aparte del carrito (que solo guarda cantidades) para no tocar su
 * cálculo de totales. La lista de unidades se ajusta a la cantidad real del
 * carrito al leerla (`unitsOf`): si sobran se descartan las últimas, si faltan
 * se completan "sin elegir".
 *
 * Funciones puras: sin estado, sin React, fáciles de probar.
 */

export interface Preparation {
  /** "Con todo": el plato tal como viene. Excluye `quitar`. */
  conTodo: boolean;
  /** Ingredientes a quitar, en el orden en que se ofrecen. */
  quitar: string[];
}

/** Preparación de cada unidad, por código de producto. */
export type Preparations = Record<string, Preparation[]>;

/** Unidades con la misma preparación, como se pintan en el carrito. */
export interface PreparationGroup {
  /** Identifica la fila: igual preparación = misma clave. */
  key: string;
  prep: Preparation;
  count: number;
  /** Posiciones de estas unidades en la lista del producto. */
  indices: number[];
}

const SIN_ELEGIR: Preparation = { conTodo: false, quitar: [] };
const CON_TODO: Preparation = { conTodo: true, quitar: [] };

/** ¿Ya eligió el cliente cómo la quiere? */
export function isChosen(prep: Preparation): boolean {
  return prep.conTodo || prep.quitar.length > 0;
}

export function preparationKey(prep: Preparation): string {
  if (prep.conTodo) return 'todo';
  if (prep.quitar.length > 0) return `sin:${prep.quitar.join('|')}`;
  return 'pendiente';
}

/** Las unidades del producto, ajustadas a la cantidad que hay en el carrito. */
export function unitsOf(preps: Preparations, code: string, quantity: number): Preparation[] {
  const guardadas = preps[code] ?? [];
  return Array.from({ length: Math.max(0, quantity) }, (_, i) => guardadas[i] ?? SIN_ELEGIR);
}

/** Agrupa las unidades iguales, en el orden en que aparece cada preparación. */
export function groupUnits(units: readonly Preparation[]): PreparationGroup[] {
  const grupos = new Map<string, PreparationGroup>();
  units.forEach((prep, i) => {
    const key = preparationKey(prep);
    const g = grupos.get(key);
    if (g) {
      g.count += 1;
      g.indices.push(i);
    } else {
      grupos.set(key, { key, prep, count: 1, indices: [i] });
    }
  });
  return [...grupos.values()];
}

function conQuitar(prep: Preparation, ingrediente: string, orden: readonly string[]): Preparation {
  const marcados = new Set(prep.quitar);
  if (marcados.has(ingrediente)) marcados.delete(ingrediente);
  else marcados.add(ingrediente);
  return { conTodo: false, quitar: orden.filter((i) => marcados.has(i)) };
}

function grupoPorClave(units: readonly Preparation[], key: string): PreparationGroup | undefined {
  return groupUnits(units).find((g) => g.key === key);
}

/**
 * Marca o desmarca "Con todo" en TODA la fila. Marcarlo borra lo que había
 * para quitar; desmarcarlo la deja sin elegir.
 */
export function toggleConTodoGroup(
  preps: Preparations,
  code: string,
  quantity: number,
  key: string,
): Preparations {
  const units = unitsOf(preps, code, quantity);
  const grupo = grupoPorClave(units, key);
  if (!grupo) return preps;
  const nueva = grupo.prep.conTodo ? SIN_ELEGIR : CON_TODO;
  for (const i of grupo.indices) units[i] = nueva;
  return { ...preps, [code]: units };
}

/**
 * Marca o desmarca un ingrediente para quitar en una fila.
 *
 * Con una sola unidad, la cambia a ella. Con varias, separa UNA unidad con el
 * cambio, y el resto queda "Con todo" si estaba sin elegir o con todo, o como
 * estaba si ya tenía su propia elección.
 *
 * `orden` son los ingredientes tal como se ofrecen, para que la lista quede
 * siempre en ese orden y no en el de los toques.
 */
export function toggleQuitarGroup(
  preps: Preparations,
  code: string,
  quantity: number,
  key: string,
  ingrediente: string,
  orden: readonly string[],
): Preparations {
  const units = unitsOf(preps, code, quantity);
  const grupo = grupoPorClave(units, key);
  if (!grupo) return preps;

  const [primera, ...resto] = grupo.indices;
  units[primera] = conQuitar(grupo.prep, ingrediente, orden);
  const restoQueda = grupo.prep.quitar.length > 0 ? grupo.prep : CON_TODO;
  for (const i of resto) units[i] = restoQueda;
  return { ...preps, [code]: units };
}

/**
 * Saca una unidad concreta de la lista (cuando el cliente la quita del
 * carrito desde su fila). Quien llama debe además restar 1 en el carrito.
 */
export function removeUnit(
  preps: Preparations,
  code: string,
  quantity: number,
  index: number,
): Preparations {
  const units = unitsOf(preps, code, quantity);
  units.splice(index, 1);
  return { ...preps, [code]: units };
}

/**
 * Texto de una preparación: "Con todo", "Sin tomate", "Sin tomate y sin
 * queso", "Sin tomate, sin lechuga y sin queso". `null` si no eligió.
 */
export function preparationLabel(prep: Preparation): string | null {
  if (prep.conTodo) return 'Con todo';
  if (prep.quitar.length === 0) return null;
  const sin = prep.quitar.map((i) => `sin ${i.toLowerCase()}`);
  const texto =
    sin.length === 1 ? sin[0] : `${sin.slice(0, -1).join(', ')} y ${sin[sin.length - 1]}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Los códigos del carrito con alguna unidad todavía sin elegir, en el orden
 * del carrito. `removablesOf` dice qué se le puede quitar a cada código
 * (vacío o `undefined` = no hace falta elegir).
 */
export function pendingChoices(
  lines: ReadonlyArray<{ code: string; quantity: number }>,
  preps: Preparations,
  removablesOf: (code: string) => readonly string[] | undefined,
): string[] {
  return lines
    .filter(
      ({ code, quantity }) =>
        (removablesOf(code)?.length ?? 0) > 0 &&
        unitsOf(preps, code, quantity).some((u) => !isChosen(u)),
    )
    .map(({ code }) => code);
}

/**
 * El detalle para la cocina, una entrada por fila elegida:
 * `["1 × Con todo", "1 × Sin tomate"]`. Vacío si nada está elegido.
 */
export function preparationSummary(units: readonly Preparation[]): string[] {
  return groupUnits(units)
    .map((g) => {
      const label = preparationLabel(g.prep);
      return label ? `${g.count} × ${label}` : null;
    })
    .filter((t): t is string => t !== null);
}
