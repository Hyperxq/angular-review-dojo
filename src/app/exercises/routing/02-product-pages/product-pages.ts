import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <h2>{{ product.name }}</h2>
    <nav>
      <a [routerLink]="[]" [queryParams]="{ tab: 'details' }">Details</a>
      <a [routerLink]="[]" [queryParams]="{ tab: 'stock' }">Stock</a>
    </nav>
    @if (tab === 'stock') {
      <p>{{ product.stock }} units in stock</p>
    } @else {
      <p>{{ product.price | currency }} - {{ product.category }}</p>
    }
    <a [routerLink]="['../', product.id + 1]">Next product</a>
  `,
})
export class ProductDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected product!: Product;
  protected tab = 'details';

  ngOnInit() {
    this.product = this.route.snapshot.data['product'];
    this.tab = this.route.snapshot.queryParamMap.get('tab') ?? 'details';
  }
}

@Component({
  selector: 'app-product-missing-page',
  template: `<h2>We could not find that product</h2>`,
})
export class ProductMissingPage {}
