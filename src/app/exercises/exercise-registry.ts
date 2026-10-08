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

export const EXERCISES: readonly Exercise[] = [];

export function routesFor(topic: Topic): Routes {
  return EXERCISES.filter((e) => e.topic === topic).map((e) => ({
    path: e.slug,
    title: e.title,
    loadComponent: e.loadComponent,
  }));
}
