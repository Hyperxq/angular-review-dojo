import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ProductStore } from './product-store';

@Component({
  selector: 'app-product-admin',
  imports: [CurrencyPipe],
  template: `
    <label>
      Filter
      <input type="search" (input)="store.setFilter($any($event.target).value)" />
    </label>
    <p class="summary">
      {{ store.count() }} products, stock value {{ store.inventoryValue() | currency }}
    </p>
    <ul class="products">
      @for (product of store.visible(); track product.id) {
        <li>
          <button type="button" class="pick" (click)="store.select(product.id)">
            {{ product.name }}
          </button>
          <span class="price">{{ product.price | currency }}</span>
          <button type="button" class="drop" (click)="store.remove(product.id)">Delete</button>
        </li>
      }
    </ul>
    @if (store.selected(); as product) {
      <section class="detail">
        <h3>{{ product.name }}</h3>
        <label>
          Price
          <input #price type="number" [value]="product.price" />
        </label>
        <button type="button" class="save" (click)="store.updatePrice(product.id, +price.value)">
          Save
        </button>
      </section>
    }
  `,
})
export class ProductAdmin implements OnInit {
  protected readonly store = inject(ProductStore);

  ngOnInit() {
    this.store.load();
  }
}
