import { Routes } from '@angular/router';
import { ExerciseIndex } from './exercises/exercise-index';

export const routes: Routes = [
  { path: '', component: ExerciseIndex, title: 'Exercises' },
  {
    path: 'rxjs',
    loadChildren: () => import('./exercises/rxjs/rxjs.routes').then((m) => m.RXJS_ROUTES),
  },
  {
    path: 'rxjs-to-signals',
    loadChildren: () =>
      import('./exercises/rxjs-to-signals/rxjs-to-signals.routes').then((m) => m.RXJS_TO_SIGNALS_ROUTES),
  },
  {
    path: 'routing',
    loadChildren: () => import('./exercises/routing/routing.routes').then((m) => m.ROUTING_ROUTES),
  },
  {
    path: 'performance',
    loadChildren: () =>
      import('./exercises/performance/performance.routes').then((m) => m.PERFORMANCE_ROUTES),
  },
  {
    path: 'forms',
    loadChildren: () => import('./exercises/forms/forms.routes').then((m) => m.FORMS_ROUTES),
  },
  {
    path: 'directives',
    loadChildren: () =>
      import('./exercises/directives/directives.routes').then((m) => m.DIRECTIVES_ROUTES),
  },
  {
    path: 'testing',
    loadChildren: () => import('./exercises/testing/testing.routes').then((m) => m.TESTING_ROUTES),
  },
  {
    path: 'change-detection',
    loadChildren: () =>
      import('./exercises/change-detection/change-detection.routes').then(
        (m) => m.CHANGE_DETECTION_ROUTES,
      ),
  },
  {
    path: 'memory',
    loadChildren: () => import('./exercises/memory/memory.routes').then((m) => m.MEMORY_ROUTES),
  },
  {
    path: 'lifecycle',
    loadChildren: () =>
      import('./exercises/lifecycle/lifecycle.routes').then((m) => m.LIFECYCLE_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
