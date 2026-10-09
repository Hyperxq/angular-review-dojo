import { Service, signal } from '@angular/core';

@Service({ autoProvided: false })
export class StepperState {
  readonly count = signal(1);

  increment() {
    this.count.update((n) => n + 1);
  }

  decrement() {
    this.count.update((n) => Math.max(1, n - 1));
  }

  reset() {
    this.count.set(1);
  }
}
