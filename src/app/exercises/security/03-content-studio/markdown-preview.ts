import { Component, ElementRef, afterRenderEffect, input, viewChild } from '@angular/core';
import { renderMarkdown } from './markdown';

@Component({
  selector: 'app-markdown-preview',
  template: `<div class="preview" #preview></div>`,
})
export class MarkdownPreview {
  readonly source = input.required<string>();

  private readonly preview = viewChild.required<ElementRef<HTMLElement>>('preview');

  constructor() {
    afterRenderEffect(() => {
      this.preview().nativeElement.innerHTML = renderMarkdown(this.source());
    });
  }
}
