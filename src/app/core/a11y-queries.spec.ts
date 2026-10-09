import { accessibleName, getByRole, queryAllByRole } from './a11y-queries';

function render(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('a11y queries', () => {
  it('finds implicit and explicit roles', () => {
    const root = render(
      '<button>Save</button><div role="button">Fake</div><a href="/x">Go</a><a>no href</a>',
    );

    expect(queryAllByRole(root, 'button').map(accessibleName)).toEqual(['Save', 'Fake']);
    expect(queryAllByRole(root, 'link')).toHaveLength(1);
  });

  it('computes names from labels, aria attributes and content', () => {
    const root = render(`
      <label for="q">Search</label><input id="q" />
      <label>Quantity <input type="number" /></label>
      <input placeholder="no label" />
      <button aria-label="Remove item"><span aria-hidden="true">x</span></button>
      <button>Buy <span aria-hidden="true">!</span></button>
      <h2 id="t">Title</h2><div role="dialog" aria-labelledby="t"></div>
    `);

    expect(getByRole(root, 'textbox', { name: 'Search' })).toBeTruthy();
    expect(getByRole(root, 'spinbutton', { name: 'Quantity' })).toBeTruthy();
    expect(queryAllByRole(root, 'textbox', { name: /no label/ })).toHaveLength(0);
    expect(getByRole(root, 'button', { name: 'Remove item' })).toBeTruthy();
    expect(getByRole(root, 'button', { name: 'Buy' })).toBeTruthy();
    expect(getByRole(root, 'dialog', { name: 'Title' })).toBeTruthy();
  });

  it('ignores hidden subtrees and explains a failed lookup', () => {
    const root = render('<div hidden><button>Hidden</button></div><button>Shown</button>');

    expect(queryAllByRole(root, 'button')).toHaveLength(1);
    expect(() => getByRole(root, 'button', { name: 'Hidden' })).toThrow(
      /Available button names: \["Shown"\]/,
    );
  });
});
