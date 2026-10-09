import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-share-banner',
  template: `<p class="banner" [innerHTML]="message()"></p>`,
})
export class ShareBanner {
  private readonly sanitizer = inject(DomSanitizer);

  readonly sharedBy = input.required<string>();
  readonly fileName = input.required<string>();

  protected readonly message = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      `<strong>${this.sharedBy()}</strong> shared <em>${this.fileName()}</em> with you`,
    ),
  );
}
