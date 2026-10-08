import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-badge',
  template: `
    <h3>{{ product.name }}</h3>
    <span class="tag">{{ tag }}</span>
    @if (discountLabel) {
      <span class="discount">{{ discountLabel }}</span>
    }
    <button type="button" (click)="expanded = !expanded">Details</button>
    @if (expanded) {
      <p class="details">{{ product.stock }} units left</p>
    }
  `,
})
export class ProductBadge implements OnInit, OnChanges {
  @Input({ required: true }) product!: Product;

  protected tag: string;
  protected discountLabel = '';
  protected expanded = false;

  constructor() {
    this.tag = (this.product?.category ?? '').toUpperCase();
  }

  ngOnInit() {
    this.discountLabel = this.product.stock <= 2 ? '20% off' : '';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['produt']) {
      this.expanded = false;
    }
  }
}
