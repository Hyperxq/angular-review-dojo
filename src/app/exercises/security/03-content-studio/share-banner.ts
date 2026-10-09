import { Component, input } from '@angular/core';

@Component({
  selector: 'app-share-banner',
  template: `
    <p class="banner">
      <strong>{{ sharedBy() }}</strong> shared <em>{{ fileName() }}</em> with you
    </p>
  `,
})
export class ShareBanner {
  readonly sharedBy = input.required<string>();
  readonly fileName = input.required<string>();
}
