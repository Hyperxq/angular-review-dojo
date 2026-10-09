import { readFileSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { SERVER_PLATFORM, enterServerMode } from '../../../core/server-env';
import { ArticlePage } from './article-page';
import { ReactionBar } from './reaction-bar';

const SOURCE = 'src/app/exercises/ssr/03-article-page/article-page.ts';

describe('L3 - article page', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function render(providers: unknown[] = []) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: providers as never[] });
    const fixture = TestBed.createComponent(ArticlePage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('does not opt any component out of hydration', async () => {
    const root = await render();

    const skipped = [...root.querySelectorAll('*')].filter((el) =>
      el.hasAttribute('ngSkipHydration'),
    );
    expect(skipped.map((el) => el.tagName.toLowerCase())).toEqual([]);
  });

  it('renders the same server HTML whatever time it is', async () => {
    enterServerMode();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const first = (await render([SERVER_PLATFORM])).innerHTML;
    vi.setSystemTime(new Date('2026-01-01T10:42:00Z'));
    const second = (await render([SERVER_PLATFORM])).innerHTML;

    expect(second).toBe(first);
  });

  it('shows how long ago each comment was posted once it is running', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const root = await render();

    expect(root.textContent).toContain('60 min ago');
    expect(root.textContent).toContain('30 min ago');
  });

  it('has a Like button that counts clicks', async () => {
    const fixture = TestBed.createComponent(ReactionBar);
    fixture.componentRef.setInput('initial', 12);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Like (13)');
  });

  it('never keeps an interactive widget inside a block that does not hydrate', () => {
    const template = readFileSync(SOURCE, 'utf8');

    const blocks = [
      ...template.matchAll(/@defer\s*\([^)]*hydrate never[^)]*\)\s*\{([\s\S]*?)\n\s*\}/g),
    ];
    const interactive = blocks.filter(([, body]) => /<app-reaction-bar/.test(body));
    expect(interactive).toHaveLength(0);
  });
});
