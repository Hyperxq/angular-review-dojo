import { Component, input } from '@angular/core';
import { LoginPage } from './login-page';
import { Review } from './review';
import { ReviewList } from './review-list';

@Component({
  selector: 'app-reviews-demo',
  imports: [ReviewList, LoginPage],
  template: `
    <h2>Reviews: Keychron K2 Keyboard</h2>
    <app-review-list [reviews]="reviews" />
    <h2>Sign in</h2>
    <p>Open this page with <code>?returnUrl=/orders</code> to try the redirect.</p>
    <app-login-page [returnUrl]="returnUrl()" />
  `,
})
export class ReviewsDemo {
  readonly returnUrl = input<string>();

  protected readonly reviews: Review[] = [
    {
      id: 1,
      author: 'Ana',
      website: 'https://ana.example/blog',
      comment: 'Great <b>typing feel</b>, a bit loud.',
    },
    {
      id: 2,
      author: 'Marcus',
      website: 'javascript:alert(document.cookie)',
      comment: 'Arrived late <img src="x" onerror="alert(\'reviewed by marcus\')">',
    },
  ];
}
