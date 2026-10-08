import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Product } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class SelectionStore {
  private readonly selection = new Subject<Product | null>();

  readonly selected$ = this.selection.asObservable();

  select(product: Product | null) {
    this.selection.next(product);
  }
}
