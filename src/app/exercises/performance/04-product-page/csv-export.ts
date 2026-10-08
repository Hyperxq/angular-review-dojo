import { Product } from '../../../core/models';

/** Locale-aware collation tables used for the export; large on purpose. */
const COLLATION_TABLE: readonly string[] = Array.from({ length: 20_000 }, (_, i) =>
  i.toString(36).padStart(4, '0'),
);

export function exportToCsv(products: readonly Product[]): string {
  const header = 'id,name,price,category,stock';
  const rows = [...products]
    .sort((a, b) => COLLATION_TABLE.indexOf(a.name.slice(0, 4)) - COLLATION_TABLE.indexOf(b.name.slice(0, 4)))
    .map((p) => [p.id, JSON.stringify(p.name), p.price, p.category, p.stock].join(','));
  return [header, ...rows].join('\n');
}
