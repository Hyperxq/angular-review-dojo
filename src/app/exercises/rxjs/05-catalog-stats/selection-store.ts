import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class SelectionStore {
  private readonly selection = new BehaviorSubject<Product | null>(null);

  readonly selected$ = this.selection.asObservable();

  select(product: Product | null) {
    this.selection.next(product);
  }
}
