import { Injectable, computed, signal } from '@angular/core';

@Injectable()
export class DraftStore {
  private readonly saved = signal('');

  readonly name = signal('');
  readonly dirty = computed(() => this.name() !== this.saved());

  save() {
    this.saved.set(this.name());
  }
}
