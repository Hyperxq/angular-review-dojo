import { Directive, OnDestroy, OnInit, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Directive()
export abstract class BaseListComponent<T> implements OnInit, OnDestroy {
  protected readonly items = signal<T[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  private readonly subscription = new Subscription();

  protected abstract load(): Observable<T[]>;

  ngOnInit() {
    this.subscription.add(
      this.load().subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      }),
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
