import { Component, input } from '@angular/core';
import { Review } from './review';

@Component({
  selector: 'app-review-list',
  template: `
    <ul class="reviews">
      @for (review of reviews(); track review.id) {
        <li>
          <h3>{{ review.author }}</h3>
          <a [href]="review.website" target="_blank" rel="noopener noreferrer">{{
            review.website
          }}</a>
          <div class="comment" [innerHTML]="review.comment"></div>
        </li>
      }
    </ul>
  `,
})
export class ReviewList {
  readonly reviews = input.required<Review[]>();
}
