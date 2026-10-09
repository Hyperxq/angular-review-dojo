import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-alert-note',
  template: `<p class="note" [innerHTML]="html()"></p>`,
})
export class AlertNote {
  private readonly sanitizer = inject(DomSanitizer);

  readonly note = input.required<string>();

  protected readonly html = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.note().replace(/\*(.+?)\*/g, '<em>$1</em>')),
  );
}
