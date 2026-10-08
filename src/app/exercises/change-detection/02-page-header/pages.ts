import { AfterViewInit, ChangeDetectorRef, Component, inject } from '@angular/core';
import { PageTitle } from './page-title';

@Component({
  selector: 'app-products-page',
  template: `<p>12 products in the catalog</p>`,
})
export class ProductsPage implements AfterViewInit {
  private readonly pageTitle = inject(PageTitle);

  ngAfterViewInit() {
    this.pageTitle.title = 'Products';
  }
}

@Component({
  selector: 'app-orders-page',
  template: `<p>3 open orders</p>`,
})
export class OrdersPage implements AfterViewInit {
  private readonly pageTitle = inject(PageTitle);
  private readonly cdr = inject(ChangeDetectorRef);

  ngAfterViewInit() {
    setTimeout(() => {
      this.pageTitle.title = 'Orders';
      this.cdr.markForCheck();
    });
  }
}
