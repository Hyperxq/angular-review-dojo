import { Service } from '@angular/core';

@Service()
export class Analytics {
  readonly events: string[] = [];

  track(event: string) {
    this.events.push(event);
  }
}
