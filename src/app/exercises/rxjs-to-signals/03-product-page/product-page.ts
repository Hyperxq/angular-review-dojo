import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, map, switchMap, takeUntil, tap } from 'rxjs';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';

@Component({
  selector: 'app-product-page',
  imports: [CurrencyPipe],
  template: `
    @if (loading()) {
      <p>Loading product…</p>
    }
    @if (error(); as message) {
      <p role="alert">{{ message }}</p>
    }
    @if (product(); as product) {
      <article>
        <h2>{{ product.name }}</h2>
        <p>{{ product.price | currency }}</p>
      </article>
    }
  `,
})
export class ProductPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProductApi);
  private readonly destroy$ = new Subject<void>();

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        tap(() => this.loading.set(true)),
        switchMap((id) => this.api.get(id)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.loading.set(false);
        },
        error: () => this.error.set('Could not load the product.'),
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
