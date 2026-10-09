const IMPLICIT_ROLES: readonly [selector: string, role: string][] = [
  ['button, input[type=button], input[type=submit]', 'button'],
  ['a[href]', 'link'],
  ['input[type=checkbox]', 'checkbox'],
  ['input[type=radio]', 'radio'],
  ['input[type=number]', 'spinbutton'],
  [
    'input:not([type]), input[type=text], input[type=email], input[type=password], input[type=tel], input[type=url], textarea',
    'textbox',
  ],
  ['input[type=search]', 'searchbox'],
  ['select', 'combobox'],
  ['h1, h2, h3, h4, h5, h6', 'heading'],
  ['ul, ol', 'list'],
  ['li', 'listitem'],
  ['dialog', 'dialog'],
  ['img[alt]', 'img'],
  ['table', 'table'],
  ['main', 'main'],
  ['nav', 'navigation'],
];

export interface RoleQuery {
  name?: string | RegExp;
}

export function roleOf(el: Element): string | null {
  const explicit = el.getAttribute('role');
  if (explicit) {
    return explicit.split(' ')[0];
  }
  return IMPLICIT_ROLES.find(([selector]) => el.matches(selector))?.[1] ?? null;
}

function visibleText(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll('[aria-hidden=true], [hidden]').forEach((n) => n.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Simplified accessible name computation: aria-labelledby, aria-label, native label, alt, content, title. */
export function accessibleName(el: Element): string {
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const root = el.getRootNode() as ParentNode;
    return labelledBy
      .split(/\s+/)
      .map((id) => root.querySelector(`[id="${id}"]`))
      .map((n) => (n ? visibleText(n) : ''))
      .join(' ')
      .trim();
  }
  const ariaLabel = el.getAttribute('aria-label')?.trim();
  if (ariaLabel) {
    return ariaLabel;
  }
  if (el.matches('input, select, textarea')) {
    const id = el.getAttribute('id');
    const label =
      (id ? (el.getRootNode() as ParentNode).querySelector(`label[for="${id}"]`) : null) ??
      el.closest('label');
    if (label) {
      return visibleText(label);
    }
    return el.getAttribute('title')?.trim() ?? '';
  }
  if (el.matches('img')) {
    return el.getAttribute('alt')?.trim() ?? '';
  }
  return visibleText(el) || (el.getAttribute('title')?.trim() ?? '');
}

function isHidden(el: Element): boolean {
  return el.closest('[hidden], [aria-hidden=true]') !== null;
}

export function queryAllByRole(
  root: ParentNode,
  role: string,
  query: RoleQuery = {},
): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('*')].filter((el) => {
    if (isHidden(el) || roleOf(el) !== role) {
      return false;
    }
    const { name } = query;
    if (name === undefined) {
      return true;
    }
    const actual = accessibleName(el);
    return typeof name === 'string' ? actual === name : name.test(actual);
  });
}

export function getByRole(root: ParentNode, role: string, query: RoleQuery = {}): HTMLElement {
  const found = queryAllByRole(root, role, query);
  if (found.length !== 1) {
    const available = queryAllByRole(root, role).map((el) => `"${accessibleName(el)}"`);
    throw new Error(
      `Expected exactly one ${role}${query.name ? ` named ${query.name}` : ''}, found ${found.length}. ` +
        `Available ${role} names: [${available.join(', ')}]`,
    );
  }
  return found[0];
}
