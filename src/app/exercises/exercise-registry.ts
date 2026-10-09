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
  'change-detection': 'Change detection',
  memory: 'Memory and profiling',
  lifecycle: 'Lifecycle',
  security: 'Security',
  ssr: 'SSR and hydration',
  a11y: 'Accessibility',
  state: 'State at scale',
  di: 'DI architecture',
  'http-errors': 'HTTP and error architecture',
  architecture: 'Feature architecture',
  capstone: 'Capstone: PR review',
} as const;

export type Topic = keyof typeof TOPICS;

/** Part 1 is framework mechanics; Part 2 is staff-level review. */
export const TOPIC_PART: Record<Topic, 1 | 2> = {
  rxjs: 1,
  'rxjs-to-signals': 1,
  routing: 1,
  performance: 1,
  forms: 1,
  directives: 1,
  testing: 1,
  'change-detection': 1,
  memory: 1,
  lifecycle: 1,
  security: 2,
  ssr: 2,
  a11y: 2,
  state: 2,
  di: 2,
  'http-errors': 2,
  architecture: 2,
  capstone: 2,
};

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
  {
    topic: 'routing',
    level: 4,
    slug: '04-account-area',
    title: 'Account area',
    loadComponent: () =>
      import('./routing/04-account-area/account-shell').then((m) => m.AccountShell),
    loadChildren: () =>
      import('./routing/04-account-area/account.routes').then((m) => m.ACCOUNT_ROUTES),
  },
  {
    topic: 'routing',
    level: 5,
    slug: '05-catalog-admin',
    title: 'Catalog admin',
    loadComponent: () => import('./routing/05-catalog-admin/admin-shell').then((m) => m.AdminShell),
    loadChildren: () =>
      import('./routing/05-catalog-admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    topic: 'performance',
    level: 1,
    slug: '01-product-grid',
    title: 'Product grid',
    loadComponent: () =>
      import('./performance/01-product-grid/product-grid').then((m) => m.ProductGrid),
  },
  {
    topic: 'performance',
    level: 2,
    slug: '02-order-summary',
    title: 'Order summary',
    loadComponent: () =>
      import('./performance/02-order-summary/order-page').then((m) => m.OrderPage),
  },
  {
    topic: 'performance',
    level: 3,
    slug: '03-product-spotlight',
    title: 'Product spotlight',
    loadComponent: () =>
      import('./performance/03-product-spotlight/product-spotlight').then((m) => m.ProductSpotlight),
  },
  {
    topic: 'performance',
    level: 4,
    slug: '04-product-page',
    title: 'Product page loading',
    loadComponent: () =>
      import('./performance/04-product-page/product-shell').then((m) => m.ProductPageShell),
    loadChildren: () =>
      import('./performance/04-product-page/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    topic: 'forms',
    level: 1,
    slug: '01-profile-form',
    title: 'Profile form',
    loadComponent: () => import('./forms/01-profile-form/profile-form').then((m) => m.ProfileForm),
  },
  {
    topic: 'forms',
    level: 2,
    slug: '02-order-form',
    title: 'Order form',
    loadComponent: () => import('./forms/02-order-form/order-form').then((m) => m.OrderForm),
  },
  {
    topic: 'forms',
    level: 3,
    slug: '03-checkout-form',
    title: 'Checkout form (Signal Forms)',
    loadComponent: () =>
      import('./forms/03-checkout-form/checkout-form').then((m) => m.CheckoutForm),
  },
  {
    topic: 'directives',
    level: 1,
    slug: '01-tooltip',
    title: 'Tooltip and highlight',
    loadComponent: () =>
      import('./directives/01-tooltip/product-actions').then((m) => m.ProductActions),
  },
  {
    topic: 'directives',
    level: 2,
    slug: '02-has-role',
    title: 'Role-based sections',
    loadComponent: () => import('./directives/02-has-role/admin-panel').then((m) => m.AdminPanel),
  },
  {
    topic: 'directives',
    level: 3,
    slug: '03-dialog-kit',
    title: 'Dialog kit (host directives)',
    loadComponent: () => import('./directives/03-dialog-kit/dialog-demo').then((m) => m.DialogDemo),
  },
  {
    topic: 'testing',
    level: 1,
    slug: '01-stock-badge',
    title: 'Stock badge (weak assertions)',
    loadComponent: () => import('./testing/01-stock-badge/stock-overview').then((m) => m.StockOverview),
  },
  {
    topic: 'testing',
    level: 2,
    slug: '02-place-order',
    title: 'Place order (over-mocking)',
    loadComponent: () =>
      import('./testing/02-place-order/place-order-demo').then((m) => m.PlaceOrderDemo),
  },
  {
    topic: 'testing',
    level: 3,
    slug: '03-cart-suite',
    title: 'Cart suite (flaky and brittle)',
    loadComponent: () => import('./testing/03-cart-suite/cart-demo').then((m) => m.CartDemo),
  },
  {
    topic: 'change-detection',
    level: 0,
    slug: '00-playground',
    title: 'Playground (read EXPLAINER.md)',
    loadComponent: () =>
      import('./change-detection/00-playground/playground').then((m) => m.Playground),
  },
  {
    topic: 'change-detection',
    level: 1,
    slug: '01-order-lines',
    title: 'Order lines',
    loadComponent: () =>
      import('./change-detection/01-order-lines/order-editor').then((m) => m.OrderEditor),
  },
  {
    topic: 'change-detection',
    level: 2,
    slug: '02-page-header',
    title: 'Page header (NG0100)',
    loadComponent: () =>
      import('./change-detection/02-page-header/pages-demo').then((m) => m.PagesDemo),
  },
  {
    topic: 'change-detection',
    level: 3,
    slug: '03-live-quote',
    title: 'Live quote (zoneless migration)',
    loadComponent: () =>
      import('./change-detection/03-live-quote/live-quote').then((m) => m.LiveQuote),
  },
  {
    topic: 'memory',
    level: 1,
    slug: '01-viewport-info',
    title: 'Viewport info (listeners and timers)',
    loadComponent: () =>
      import('./memory/01-viewport-info/viewport-info').then((m) => m.ViewportInfo),
  },
  {
    topic: 'memory',
    level: 2,
    slug: '02-tile-registry',
    title: 'Tile registry (retention)',
    loadComponent: () => import('./memory/02-tile-registry/tiles-demo').then((m) => m.TilesDemo),
  },
  {
    topic: 'memory',
    level: 3,
    slug: '03-sales-dashboard',
    title: 'Sales dashboard (third-party widget)',
    loadComponent: () =>
      import('./memory/03-sales-dashboard/dashboard-demo').then((m) => m.DashboardDemo),
  },
  {
    topic: 'lifecycle',
    level: 1,
    slug: '01-product-badge',
    title: 'Product badge (inputs and hooks)',
    loadComponent: () => import('./lifecycle/01-product-badge/badge-demo').then((m) => m.BadgeDemo),
  },
  {
    topic: 'lifecycle',
    level: 2,
    slug: '02-chart-frame',
    title: 'Chart frame (view timing)',
    loadComponent: () => import('./lifecycle/02-chart-frame/chart-frame').then((m) => m.ChartFrame),
  },
  {
    topic: 'lifecycle',
    level: 3,
    slug: '03-list-widgets',
    title: 'List widgets (inheritance and hooks)',
    loadComponent: () =>
      import('./lifecycle/03-list-widgets/list-widgets').then((m) => m.ListWidgets),
  },
  {
    topic: 'security',
    level: 1,
    slug: '01-product-reviews',
    title: 'Product reviews (untrusted content)',
    loadComponent: () =>
      import('./security/01-product-reviews/reviews-demo').then((m) => m.ReviewsDemo),
  },
  {
    topic: 'security',
    level: 2,
    slug: '02-api-client',
    title: 'API client (tokens, CSRF, logs)',
    loadComponent: () =>
      import('./security/02-api-client/api-client-demo').then((m) => m.ApiClientDemo),
  },
  {
    topic: 'security',
    level: 3,
    slug: '03-content-studio',
    title: 'Content studio (markdown, files, sanitizer)',
    loadComponent: () =>
      import('./security/03-content-studio/studio-demo').then((m) => m.StudioDemo),
  },
  {
    topic: 'ssr',
    level: 1,
    slug: '01-preferences',
    title: 'Preferences panel (browser globals)',
    loadComponent: () => import('./ssr/01-preferences/preferences').then((m) => m.Preferences),
  },
  {
    topic: 'ssr',
    level: 2,
    slug: '02-news-feed',
    title: 'News feed (hydration mismatches)',
    loadComponent: () => import('./ssr/02-news-feed/news-feed').then((m) => m.NewsFeed),
  },
  {
    topic: 'ssr',
    level: 3,
    slug: '03-article-page',
    title: 'Article page (incremental hydration)',
    loadComponent: () =>
      import('./ssr/03-article-page/article-page').then((m) => m.ArticlePage),
  },
  {
    topic: 'a11y',
    level: 1,
    slug: '01-product-rows',
    title: 'Product rows (names, roles, focus)',
    loadComponent: () => import('./a11y/01-product-rows/product-rows').then((m) => m.ProductRows),
  },
  {
    topic: 'a11y',
    level: 2,
    slug: '02-filter-widgets',
    title: 'Filter widgets (dropdown, dialog, errors)',
    loadComponent: () =>
      import('./a11y/02-filter-widgets/filter-widgets-demo').then((m) => m.FilterWidgetsDemo),
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
