import { describe, expect, it } from 'vitest';
import {
  groupUnits,
  pendingChoices,
  preparationLabel,
  preparationSummary,
  removeUnit,
  toggleConTodoGroup,
  toggleQuitarGroup,
  unitsOf,
  type Preparations,
} from './preparation';

const ORDEN = ['Tomate', 'Lechuga', 'Ensalada', 'Queso'];

/** Las filas del lomito como se verían en el carrito: "clave×cantidad". */
const filas = (p: Preparations, qty: number) =>
  groupUnits(unitsOf(p, 'lomito', qty)).map((g) => `${g.key}×${g.count}`);

describe('preparación por unidad', () => {
  it('las unidades nuevas empiezan sin elegir, en una sola fila', () => {
    expect(filas({}, 2)).toEqual(['pendiente×2']);
  });

  it('"Con todo" se aplica a toda la fila', () => {
    const p = toggleConTodoGroup({}, 'lomito', 2, 'pendiente');
    expect(filas(p, 2)).toEqual(['todo×2']);
    // Desmarcarlo la deja sin elegir.
    expect(filas(toggleConTodoGroup(p, 'lomito', 2, 'todo'), 2)).toEqual(['pendiente×2']);
  });

  it('quitar en una fila de 2 separa 1 y deja la otra "Con todo"', () => {
    const p = toggleQuitarGroup({}, 'lomito', 2, 'pendiente', 'Tomate', ORDEN);
    expect(filas(p, 2)).toEqual(['sin:Tomate×1', 'todo×1']);
  });

  it('quitar sobre la fila "Con todo" vuelve a separar una', () => {
    let p = toggleQuitarGroup({}, 'lomito', 3, 'pendiente', 'Tomate', ORDEN);
    expect(filas(p, 3)).toEqual(['sin:Tomate×1', 'todo×2']);
    p = toggleQuitarGroup(p, 'lomito', 3, 'todo', 'Queso', ORDEN);
    expect(filas(p, 3)).toEqual(['sin:Tomate×1', 'sin:Queso×1', 'todo×1']);
  });

  it('las unidades que quedan iguales se juntan en una fila', () => {
    let p = toggleQuitarGroup({}, 'lomito', 2, 'pendiente', 'Tomate', ORDEN);
    p = toggleQuitarGroup(p, 'lomito', 2, 'todo', 'Tomate', ORDEN);
    expect(filas(p, 2)).toEqual(['sin:Tomate×2']);
  });

  it('en una fila de varias con su propia elección, el resto la conserva', () => {
    let p = toggleQuitarGroup({}, 'lomito', 2, 'pendiente', 'Tomate', ORDEN);
    p = toggleQuitarGroup(p, 'lomito', 2, 'todo', 'Tomate', ORDEN); // sin tomate × 2
    p = toggleQuitarGroup(p, 'lomito', 2, 'sin:Tomate', 'Queso', ORDEN);
    expect(filas(p, 2)).toEqual(['sin:Tomate|Queso×1', 'sin:Tomate×1']);
  });

  it('con una sola unidad, quitar la cambia a ella sin separar', () => {
    let p = toggleQuitarGroup({}, 'lomito', 1, 'pendiente', 'Queso', ORDEN);
    p = toggleQuitarGroup(p, 'lomito', 1, 'sin:Queso', 'Tomate', ORDEN);
    expect(filas(p, 1)).toEqual(['sin:Tomate|Queso×1']);
    // Desmarcar todo la deja sin elegir.
    p = toggleQuitarGroup(p, 'lomito', 1, 'sin:Tomate|Queso', 'Tomate', ORDEN);
    p = toggleQuitarGroup(p, 'lomito', 1, 'sin:Queso', 'Queso', ORDEN);
    expect(filas(p, 1)).toEqual(['pendiente×1']);
  });

  it('se ajusta a la cantidad del carrito: suma sin elegir y descarta las últimas', () => {
    const p = toggleConTodoGroup({}, 'lomito', 1, 'pendiente');
    expect(filas(p, 3)).toEqual(['todo×1', 'pendiente×2']);
    const q = toggleQuitarGroup({}, 'lomito', 2, 'pendiente', 'Tomate', ORDEN);
    expect(filas(q, 1)).toEqual(['sin:Tomate×1']);
  });

  it('removeUnit saca justo esa unidad', () => {
    const p = toggleQuitarGroup({}, 'lomito', 2, 'pendiente', 'Tomate', ORDEN);
    expect(filas(removeUnit(p, 'lomito', 2, 0), 1)).toEqual(['todo×1']);
  });

  it('arma la frase con comas y "y"', () => {
    expect(preparationLabel({ conTodo: false, quitar: ['Tomate', 'Lechuga', 'Queso'] })).toBe(
      'Sin tomate, sin lechuga y sin queso',
    );
  });

  it('resume para la cocina por fila', () => {
    const p = toggleQuitarGroup({}, 'lomito', 3, 'pendiente', 'Tomate', ORDEN);
    expect(preparationSummary(unitsOf(p, 'lomito', 3))).toEqual(['1 × Sin tomate', '2 × Con todo']);
  });

  it('solo exige elección a los platos con ingredientes quitables y unidades pendientes', () => {
    const quitables = (code: string) => (code === 'papas' ? undefined : ORDEN);
    let preps = toggleConTodoGroup({}, 'choripan', 1, 'pendiente');
    preps = toggleQuitarGroup(preps, 'milanesa', 2, 'pendiente', 'Queso', ORDEN); // 1 sin queso + 1 con todo
    const lines = [
      { code: 'lomito', quantity: 1 },
      { code: 'papas', quantity: 2 },
      { code: 'choripan', quantity: 2 }, // la segunda unidad está sin elegir
      { code: 'milanesa', quantity: 2 },
    ];
    expect(pendingChoices(lines, preps, quitables)).toEqual(['lomito', 'choripan']);
  });
});
