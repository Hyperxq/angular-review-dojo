import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageTitle {
  readonly title = signal('');
}
