import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-reaction-bar',
  template: ` <button type="button" (click)="like()">Like ({{ likes() }})</button> `,
})
export class ReactionBar {
  readonly initial = input(0);

  protected readonly extra = signal(0);
  protected likes() {
    return this.initial() + this.extra();
  }

  protected like() {
    this.extra.update((n) => n + 1);
  }
}
