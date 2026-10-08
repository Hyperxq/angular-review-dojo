import { Component } from '@angular/core';

@Component({
  selector: 'app-reviews-panel',
  template: `
    <section aria-label="Customer reviews">
      <h3>Customer reviews</h3>
      <ul>
        @for (review of reviews; track review.author) {
          <li>
            <strong>{{ review.author }}</strong> {{ review.stars }}/5 - {{ review.text }}
          </li>
        }
      </ul>
    </section>
  `,
})
export class ReviewsPanel {
  protected readonly reviews = [
    { author: 'Mia', stars: 5, text: 'Great keyboard, the switches feel excellent.' },
    { author: 'Leo', stars: 4, text: 'Solid build. Battery could last longer.' },
    { author: 'Ana', stars: 5, text: 'Arrived early and works with all my devices.' },
  ];
}
