import { Routes } from '@angular/router';
import { Type } from '@angular/core';

export const TOPICS = {
  rxjs: 'RxJS',
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
];

export function routesFor(topic: Topic): Routes {
  return EXERCISES.filter((e) => e.topic === topic).map((e) => ({
    path: e.slug,
    title: e.title,
    loadComponent: e.loadComponent,
  }));
}
