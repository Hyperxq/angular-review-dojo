import { readFileSync, readdirSync, statSync } from 'node:fs';

export interface SourceImport {
  specifier: string;
  /** Path (relative to the scanned root) of the imported file, or null for packages and files outside the root. */
  target: string | null;
}

export interface SourceFile {
  path: string;
  lines: number;
  imports: SourceImport[];
}

const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g;

function listFiles(root: string, dir = ''): string[] {
  return readdirSync(dir ? `${root}/${dir}` : root).flatMap((name) => {
    const relative = dir ? `${dir}/${name}` : name;
    return statSync(`${root}/${relative}`).isDirectory() ? listFiles(root, relative) : [relative];
  });
}

function resolve(from: string, specifier: string): string | null {
  const parts = from.split('/').slice(0, -1);
  for (const segment of specifier.split('/')) {
    if (segment === '..') {
      if (parts.length === 0) {
        return null;
      }
      parts.pop();
    } else if (segment !== '.' && segment !== '') {
      parts.push(segment);
    }
  }
  return parts.join('/');
}

/** Reads every non-spec `.ts` file under `root` (relative to the repository root) and resolves its relative imports. */
export function loadSources(root: string): SourceFile[] {
  const files = listFiles(root).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'));
  const known = new Set(files);

  return files.map((path) => {
    const text = readFileSync(`${root}/${path}`, 'utf8');
    const imports = [...text.matchAll(IMPORT)].map((match) => {
      const specifier = match[1] ?? match[2];
      const base = specifier.startsWith('.') ? resolve(path, specifier) : null;
      const target =
        base === null
          ? null
          : ([`${base}.ts`, `${base}/index.ts`].find((c) => known.has(c)) ?? null);
      return { specifier, target };
    });
    return { path, lines: text.split('\n').length, imports };
  });
}
