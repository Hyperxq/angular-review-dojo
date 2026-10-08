import { Component, inject } from '@angular/core';
import { PageTitle } from './page-title';

@Component({
  selector: 'app-products-page',
  template: `<p>12 products in the catalog</p>`,
})
export class ProductsPage {
  constructor() {
    inject(PageTitle).title.set('Products');
  }
}

@Component({
  selector: 'app-orders-page',
  template: `<p>3 open orders</p>`,
})
export class OrdersPage {
  constructor() {
    inject(PageTitle).title.set('Orders');
  }
}
