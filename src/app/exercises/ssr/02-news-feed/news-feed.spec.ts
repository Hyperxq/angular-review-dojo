import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Product } from '../../../core/models';
import { SERVER_PLATFORM } from '../../../core/server-env';
import { provideFeedApp } from './feed-providers';
import { NewsFeed } from './news-feed';

const PRODUCTS: Product[] = [
  { id: 1, name: 'Keychron K2 Keyboard', price: 89, category: 'keyboards', stock: 12 },
  { id: 2, name: 'Logitech MX Master 3S', price: 99, category: 'mice', stock: 20 },
  { id: 3, name: 'Glorious Model O', price: 59, category: 'mice', stock: 2 },
];

describe('L2 - news feed', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.getElementById('ng-state')?.remove();
  });

  async function render(providers: unknown[] = []) {
    TestBed.configureTestingModule({
      providers: [provideFeedApp(), provideHttpClientTesting(), ...(providers as never[])],
    });
    const fixture = TestBed.createComponent(NewsFeed);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .match('/api/products')
      .forEach((r) => r.flush(PRODUCTS));
    await fixture.whenStable();
    return fixture;
  }

  async function serverHtml(now: Date, random: number) {
    TestBed.resetTestingModule();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    vi.spyOn(Math, 'random').mockReturnValue(random);
    const fixture = await render([SERVER_PLATFORM]);
    return (fixture.nativeElement as HTMLElement).innerHTML;
  }

  describe('server render', () => {
    it('does not print the time of the render', async () => {
      const first = await serverHtml(new Date('2026-01-01T10:00:00Z'), 0);
      const second = await serverHtml(new Date('2026-01-01T10:07:42Z'), 0);

      expect(second).toBe(first);
    });

    it('does not pick the featured deal at random', async () => {
      const first = await serverHtml(new Date('2026-01-01T10:00:00Z'), 0.01);
      const second = await serverHtml(new Date('2026-01-01T10:00:00Z'), 0.99);

      expect(second).toBe(first);
    });

    it('survives being serialized and parsed again by the browser', async () => {
      const fixture = await render([SERVER_PLATFORM]);

      const html = (fixture.nativeElement as HTMLElement).innerHTML;
      const reparsed = document.createElement('div');
      reparsed.innerHTML = html;
      expect(reparsed.innerHTML).toBe(html);
    });
  });

  describe('in the browser', () => {
    it('shows the deals', async () => {
      const fixture = await render();

      const names = [
        ...(fixture.nativeElement as HTMLElement).querySelectorAll('td:first-child'),
      ].map((td) => td.textContent);
      expect(names).toEqual(PRODUCTS.map((p) => p.name));
    });

    it('shows the time and a featured deal once it is running', async () => {
      const fixture = await render();
      const root = fixture.nativeElement as HTMLElement;

      expect(root.querySelector('.stamp')?.textContent).toMatch(/Updated \d/);
      expect(root.querySelector('.featured')?.textContent).toContain('Featured:');
    });
  });

  describe('HTTP transfer cache', () => {
    it('does not request again in the browser what the server already fetched', async () => {
      vi.stubGlobal('ngServerMode', true);
      TestBed.resetTestingModule();
      await render([SERVER_PLATFORM]);
      const serialized = TestBed.inject(TransferState).toJson();

      vi.unstubAllGlobals();
      TestBed.resetTestingModule();
      const script = document.createElement('script');
      script.id = 'ng-state';
      script.type = 'application/json';
      script.textContent = serialized;
      document.body.append(script);

      TestBed.configureTestingModule({ providers: [provideFeedApp(), provideHttpClientTesting()] });
      const fixture = TestBed.createComponent(NewsFeed);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve));

      const requests = TestBed.inject(HttpTestingController).match('/api/products');
      requests.forEach((r) => r.flush(PRODUCTS));
      await fixture.whenStable();
      expect(requests).toHaveLength(0);
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Keychron K2 Keyboard');
    });
  });
});
