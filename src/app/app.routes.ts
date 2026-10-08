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
  { path: '**', redirectTo: '' },
];
