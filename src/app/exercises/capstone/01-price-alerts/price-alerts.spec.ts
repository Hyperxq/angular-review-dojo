import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PriceAlert } from './alert.models';
import { AlertNote } from './alert-note';
import { AlertsApi } from './alerts-api';
import { AlertsPage } from './alerts-page';
import { AlertsBadge } from './alerts-shell';

const alert = (id: number, productName: string, note = ''): PriceAlert => ({
  id,
  productId: 1,
  productName,
  targetPrice: 50,
  note,
  createdAt: '2026-01-01T00:00:00Z',
});
@Component({
  imports: [AlertsBadge, AlertsPage],
  template: `<app-alerts-badge /><app-alerts-page />`,
})
class ShellHost {}

const tick = () => new Promise((resolve) => setTimeout(resolve));

describe('Capstone - price alerts (blocking issues only)', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  describe('notes written by customers', () => {
    async function render(note: string) {
      const fixture = TestBed.createComponent(AlertNote);
      fixture.componentRef.setInput('note', note);
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    }

    it('still supports *emphasis*', async () => {
      const root = await render('Buy *now*');

      expect(root.querySelector('em')?.textContent).toBe('now');
    });

    it('can never run code', async () => {
      const root = await render('Cheap <img src="x" onerror="alert(1)"> *deal*');

      const handlers = [...root.querySelectorAll('*')].flatMap((el) =>
        el.getAttributeNames().filter((name) => name.startsWith('on')),
      );
      expect(handlers).toEqual([]);
      expect(root.querySelector('em')?.textContent).toBe('deal');
    });
  });

  describe('creating alerts', () => {
    it('sends the request once even when the server fails', async () => {
      const failed = vi.fn();
      TestBed.inject(AlertsApi)
        .create({ productId: 1, productName: 'Keychron K2 Keyboard', targetPrice: 50, note: '' })
        .subscribe({ error: failed });

      backend.expectOne('/api/alerts').flush('down', { status: 502, statusText: 'Bad Gateway' });
      await tick();

      backend.expectNone('/api/alerts');
      expect(failed).toHaveBeenCalledOnce();
    });
  });

  describe('searching', () => {
    it('shows the results of the latest search, whatever order the answers arrive in', async () => {
      const fixture = TestBed.createComponent(AlertsPage);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const input = root.querySelector<HTMLInputElement>('input[type=search]')!;
      const type = async (value: string) => {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        await tick();
      };
      const byTerm = (term: string) =>
        backend.match((r) => r.url === '/api/alerts' && r.params.get('product') === term);

      await tick();
      backend.match((r) => r.url === '/api/alerts').forEach((r) => r.flush([]));
      await type('k');
      await type('ke');

      byTerm('ke').forEach((r) => r.flush([alert(2, 'Keychron K2 Keyboard')]));
      byTerm('k')
        .filter((r) => !r.cancelled)
        .forEach((r) =>
          r.flush([alert(1, 'Keychron K2 Keyboard'), alert(3, 'Kensington Trackball')]),
        );
      await tick();
      fixture.detectChanges();

      expect([...root.querySelectorAll('.alerts li strong')].map((s) => s.textContent)).toEqual([
        'Keychron K2 Keyboard',
      ]);
    });
  });

  describe('header badge', () => {
    it('counts the alerts created on the page', async () => {
      const fixture = TestBed.createComponent(ShellHost);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      backend
        .match((r) => r.url === '/api/alerts' && r.method === 'GET')
        .forEach((r) => r.flush([]));

      const price = root.querySelector<HTMLInputElement>('input[type=number]')!;
      price.value = '50';
      price.dispatchEvent(new Event('input'));
      root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      backend.expectOne((r) => r.method === 'POST').flush(alert(1, 'Keychron K2 Keyboard'));
      await tick();
      fixture.detectChanges();

      expect(root.querySelector('.badge')?.textContent).toContain('1 active');
      expect(root.querySelectorAll('.alerts li strong')).toHaveLength(1);
    });
  });
});
