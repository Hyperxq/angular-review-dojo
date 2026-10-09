import { Component, computed, input } from '@angular/core';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

@Component({
  selector: 'app-alert-note',
  template: `<p class="note" [innerHTML]="html()"></p>`,
})
export class AlertNote {
  readonly note = input.required<string>();

  protected readonly html = computed(() =>
    this.note()
      .replace(/[&<>"]/g, (char) => ESCAPES[char])
      .replace(/\*(.+?)\*/g, '<em>$1</em>'),
  );
}
