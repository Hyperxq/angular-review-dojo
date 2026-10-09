import { Component, computed, input } from '@angular/core';
import { renderMarkdown } from './markdown';

@Component({
  selector: 'app-markdown-preview',
  template: `<div class="preview" [innerHTML]="html()"></div>`,
})
export class MarkdownPreview {
  readonly source = input.required<string>();

  protected readonly html = computed(() => renderMarkdown(this.source()));
}
