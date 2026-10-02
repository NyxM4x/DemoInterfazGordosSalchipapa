'use client';

import { CATEGORY_TABS, type CategoryFilter } from '@/lib/menu/catalog';

/**
 * Pestañas de categoría: texto en mayúsculas, la activa en naranja con subrayado
 * (estilo carta). Scroll horizontal solo dentro de la barra.
 */
export function CategoryTabs({
  active,
  onChange,
}: {
  active: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Categorías del menú"
      className="flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORY_TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`font-body relative shrink-0 py-2 text-xs font-semibold tracking-wider uppercase transition-colors sm:text-sm ${
              selected ? 'text-[var(--menu-orange)]' : 'text-white/80 hover:text-white'
            }`}
          >
            {tab.label}
            <span
              className={`absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[var(--menu-orange)] transition-opacity ${
                selected ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
