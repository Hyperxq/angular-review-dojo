import { Component, signal } from '@angular/core';
import { ConfirmDialog } from './confirm-dialog';
import { NewsletterForm } from './newsletter-form';
import { SortDropdown } from './sort-dropdown';

@Component({
  selector: 'app-filter-widgets-demo',
  imports: [SortDropdown, ConfirmDialog, NewsletterForm],
  template: `
    <app-sort-dropdown label="Sort by" [options]="sortOptions" [(value)]="sort" />

    <h2>Account</h2>
    <button type="button" (click)="confirmOpen.set(true)">Delete account</button>
    <app-confirm-dialog
      title="Delete account?"
      [(open)]="confirmOpen"
      (confirmed)="deleted.set(true)"
    >
      <p>This removes your orders and wishlist for good.</p>
    </app-confirm-dialog>
    @if (deleted()) {
      <p>Account deleted.</p>
    }

    <h2>Newsletter</h2>
    <app-newsletter-form />
  `,
})
export class FilterWidgetsDemo {
  protected readonly sortOptions = [
    'Relevance',
    'Price: low to high',
    'Price: high to low',
    'Newest',
  ];
  protected readonly sort = signal('Relevance');
  protected readonly confirmOpen = signal(false);
  protected readonly deleted = signal(false);
}
