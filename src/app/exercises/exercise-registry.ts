import { Routes } from '@angular/router';
import { Type } from '@angular/core';

export const TOPICS = {
  rxjs: 'RxJS',
  'rxjs-to-signals': 'RxJS to Signals',
  routing: 'Routing',
  performance: 'Performance',
  forms: 'Forms',
  directives: 'Directives',
  testing: 'Testing',
} as const;

export type Topic = keyof typeof TOPICS;

export interface Exercise {
  topic: Topic;
  level: number;
  /** Folder name under the topic, also used as the URL segment. */
  slug: string;
  title: string;
  loadComponent: () => Promise<Type<unknown>>;
  /** Child routes rendered inside the component's outlet (routing exercises). */
  loadChildren?: () => Promise<Routes>;
}

export const EXERCISES: readonly Exercise[] = [
  {
    topic: 'rxjs',
    level: 1,
    slug: '01-product-list',
    title: 'Product list',
    loadComponent: () => import('./rxjs/01-product-list/product-list').then((m) => m.ProductList),
  },
  {
    topic: 'rxjs',
    level: 2,
    slug: '02-product-detail',
    title: 'Product detail',
    loadComponent: () =>
      import('./rxjs/02-product-detail/product-detail').then((m) => m.ProductDetail),
  },
  {
    topic: 'rxjs',
    level: 3,
    slug: '03-product-search',
    title: 'Product search',
    loadComponent: () =>
      import('./rxjs/03-product-search/product-search').then((m) => m.ProductSearch),
  },
  {
    topic: 'rxjs',
    level: 4,
    slug: '04-category-browser',
    title: 'Category browser',
    loadComponent: () =>
      import('./rxjs/04-category-browser/category-browser').then((m) => m.CategoryBrowser),
  },
  {
    topic: 'rxjs',
    level: 5,
    slug: '05-catalog-stats',
    title: 'Catalog stats',
    loadComponent: () =>
      import('./rxjs/05-catalog-stats/catalog-stats').then((m) => m.CatalogStats),
  },
  {
    topic: 'rxjs',
    level: 6,
    slug: '06-product-browser',
    title: 'Product browser',
    loadComponent: () =>
      import('./rxjs/06-product-browser/product-browser').then((m) => m.ProductBrowser),
  },
  {
    topic: 'rxjs',
    level: 7,
    slug: '07-order-panel',
    title: 'Order panel',
    loadComponent: () => import('./rxjs/07-order-panel/order-panel').then((m) => m.OrderPanel),
  },
  {
    topic: 'rxjs',
    level: 8,
    slug: '08-cart-store',
    title: 'Cart store',
    loadComponent: () => import('./rxjs/08-cart-store/cart-panel').then((m) => m.CartPanel),
  },
  {
    topic: 'rxjs-to-signals',
    level: 1,
    slug: '01-cart-service',
    title: 'Cart service',
    loadComponent: () =>
      import('./rxjs-to-signals/01-cart-service/cart-summary').then((m) => m.CartSummary),
  },
  {
    topic: 'rxjs-to-signals',
    level: 2,
    slug: '02-variant-picker',
    title: 'Variant picker',
    loadComponent: () =>
      import('./rxjs-to-signals/02-variant-picker/variant-picker').then((m) => m.VariantPicker),
  },
  {
    topic: 'rxjs-to-signals',
    level: 3,
    slug: '03-product-page',
    title: 'Product page',
    loadComponent: () =>
      import('./rxjs-to-signals/03-product-page/product-page').then((m) => m.ProductPage),
  },
  {
    topic: 'rxjs-to-signals',
    level: 4,
    slug: '04-quick-search',
    title: 'Quick search',
    loadComponent: () =>
      import('./rxjs-to-signals/04-quick-search/quick-search').then((m) => m.QuickSearch),
  },
  {
    topic: 'routing',
    level: 1,
    slug: '01-shop-routes',
    title: 'Shop routes',
    loadComponent: () => import('./routing/01-shop-routes/shop-shell').then((m) => m.ShopShell),
    loadChildren: () => import('./routing/01-shop-routes/shop.routes').then((m) => m.SHOP_ROUTES),
  },
  {
    topic: 'routing',
    level: 2,
    slug: '02-product-pages',
    title: 'Product pages',
    loadComponent: () =>
      import('./routing/02-product-pages/product-pages-shell').then((m) => m.ProductPagesShell),
    loadChildren: () =>
      import('./routing/02-product-pages/product-pages.routes').then((m) => m.PRODUCT_PAGES_ROUTES),
  },
  {
    topic: 'routing',
    level: 3,
    slug: '03-admin-area',
    title: 'Admin area',
    loadComponent: () => import('./routing/03-admin-area/area-shell').then((m) => m.AreaShell),
    loadChildren: () => import('./routing/03-admin-area/area.routes').then((m) => m.AREA_ROUTES),
  },
];

export function routesFor(topic: Topic): Routes {
  return EXERCISES.filter((e) => e.topic === topic).map((e) => ({
    path: e.slug,
    title: e.title,
    loadComponent: e.loadComponent,
    ...(e.loadChildren && { loadChildren: e.loadChildren }),
  }));
}
