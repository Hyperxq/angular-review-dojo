import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PreloadingStrategy, provideRouter } from '@angular/router';
import { catalogRouterFeature } from './app-preloading';
import { CATALOG_ROUTES } from './catalog.routes';
import { ProductDetailPage } from './product-detail-page';

describe('L4 - product page loading', () => {
  describe('routes', () => {
    const route = (path: string) => CATALOG_ROUTES.find((r) => r.path === path)!;

    it('loads staff-only pages on demand', () => {
      expect(route('admin').component).toBeUndefined();
      expect(route('admin').loadComponent).toBeTypeOf('function');
      expect(route('reports').loadComponent).toBeTypeOf('function');
    });

    it('preloads only the pages people really go to next', () => {
      TestBed.configureTestingModule({
        providers: [provideRouter(CATALOG_ROUTES, catalogRouterFeature)],
      });
      const appPreloading = TestBed.inject(PreloadingStrategy);
      const preloaded = CATALOG_ROUTES.filter((r) => {
        let loaded = false;
        appPreloading.preload(r, () => {
          loaded = true;
          return of(null);
        });
        return loaded;
      }).map((r) => r.path);

      expect(preloaded).toEqual(['checkout']);
    });
  });

  describe('reviews', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual });
    });

    it('shows the product straight away', async () => {
      const fixture = TestBed.createComponent(ProductDetailPage);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Keychron K2 Keyboard');
    });

    it('defers the reviews panel and reserves its space meanwhile', async () => {
      const fixture = TestBed.createComponent(ProductDetailPage);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;

      const blocks = await fixture.getDeferBlocks();
      expect(blocks).toHaveLength(1);
      expect(el.textContent).not.toContain('Great keyboard');
      expect(el.querySelector('.reviews-placeholder')).not.toBeNull();

      await blocks[0].render(DeferBlockState.Loading);
      expect(el.textContent).toContain('Loading reviews');

      await blocks[0].render(DeferBlockState.Complete);
      expect(el.textContent).toContain('Great keyboard');
      expect(el.querySelector('.reviews-placeholder')).toBeNull();
    });
  });

  describe('csv export', () => {
    it('exports the catalog on demand and reports how many products', async () => {
      TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual });
      const fixture = TestBed.createComponent(ProductDetailPage);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;

      [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Export'))!.click();
      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(el.textContent).toContain('Exported 12 products');
      });
    });
  });
});
