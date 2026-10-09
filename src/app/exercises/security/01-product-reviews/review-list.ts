import { Component, input } from '@angular/core';
import { Review } from './review';
import { SafeHtmlPipe } from './safe-html.pipe';
import { SafeUrlPipe } from './safe-url.pipe';

@Component({
  selector: 'app-review-list',
  imports: [SafeHtmlPipe, SafeUrlPipe],
  template: `
    <ul class="reviews">
      @for (review of reviews(); track review.id) {
        <li>
          <h3>{{ review.author }}</h3>
          <a [href]="review.website | safeUrl" target="_blank" rel="noopener">{{
            review.website
          }}</a>
          <div class="comment" [innerHTML]="review.comment | safeHtml"></div>
        </li>
      }
    </ul>
  `,
})
export class ReviewList {
  readonly reviews = input.required<Review[]>();
}
