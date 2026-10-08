import { Component, ElementRef, computed, inject, input } from '@angular/core';
import { PreviewCache } from './preview-cache';

@Component({
  selector: 'app-search-preview',
  template: `{{ preview() }}`,
})
export class SearchPreview {
  private readonly cache = inject(PreviewCache);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly query = input.required<string>();
  protected readonly preview = computed(() => this.cache.render(this.query(), this.host.nativeElement));
}
