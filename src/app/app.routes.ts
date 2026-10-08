import { Routes } from '@angular/router';
import { ExerciseIndex } from './exercises/exercise-index';

export const routes: Routes = [
  { path: '', component: ExerciseIndex, title: 'Exercises' },
  {
    path: 'rxjs',
    loadChildren: () => import('./exercises/rxjs/rxjs.routes').then((m) => m.RXJS_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
