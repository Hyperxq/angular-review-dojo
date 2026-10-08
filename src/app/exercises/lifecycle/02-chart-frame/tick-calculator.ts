import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TickCalculator {
  ticks(width: number): number[] {
    const count = Math.max(2, Math.floor(width / 100) + 1);
    return Array.from({ length: count }, (_, i) => Math.round((i * width) / (count - 1)));
  }
}
