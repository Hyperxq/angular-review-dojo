import { loadSources } from '../../../core/architecture-rules';

const ROOT = 'src/app/exercises/architecture/02-boundaries';
const sources = loadSources(ROOT);

/** `features/billing/x.ts` -> `billing`; `shared/money.ts` -> `shared`; files at the root -> `root`. */
const moduleOf = (path: string) =>
  path.startsWith('features/')
    ? path.split('/')[1]
    : path.includes('/')
      ? path.split('/')[0]
      : 'root';

const crossModuleImports = sources.flatMap((file) =>
  file.imports
    .filter((i) => i.target !== null && moduleOf(i.target) !== moduleOf(file.path))
    .map((i) => ({ from: file.path, to: i.target as string })),
);

describe('L2 - architecture fitness functions', () => {
  it('scans enough code to mean something', () => {
    expect(sources.length).toBeGreaterThanOrEqual(10);
    expect(crossModuleImports.length).toBeGreaterThanOrEqual(5);
  });

  it('lets a feature use another feature only through its index.ts', () => {
    const violations = crossModuleImports
      .filter(({ to }) => to.startsWith('features/'))
      .filter(({ to }) => to !== `features/${moduleOf(to)}/index.ts`)
      .map(({ from, to }) => `${from} -> ${to}`);

    expect(violations).toEqual([]);
  });

  it('keeps shared independent of every feature', () => {
    const violations = crossModuleImports
      .filter(({ from, to }) => moduleOf(from) === 'shared' && to.startsWith('features/'))
      .map(({ from, to }) => `${from} -> ${to}`);

    expect(violations).toEqual([]);
  });

  it('has no dependency cycles between features', () => {
    const graph = new Map<string, Set<string>>();
    for (const { from, to } of crossModuleImports) {
      if (from.startsWith('features/') && to.startsWith('features/')) {
        graph.set(moduleOf(from), (graph.get(moduleOf(from)) ?? new Set()).add(moduleOf(to)));
      }
    }

    const cycles: string[] = [];
    const visit = (node: string, path: string[]) => {
      if (path.includes(node)) {
        cycles.push([...path.slice(path.indexOf(node)), node].join(' -> '));
        return;
      }
      for (const next of graph.get(node) ?? []) {
        visit(next, [...path, node]);
      }
    };
    for (const node of graph.keys()) {
      visit(node, []);
    }

    expect([...new Set(cycles)]).toEqual([]);
  });
});
