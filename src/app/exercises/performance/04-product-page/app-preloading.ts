import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route, withPreloading } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloading implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.data?.['preload'] ? load() : of(null);
  }
}

export const catalogRouterFeature = withPreloading(SelectivePreloading);
