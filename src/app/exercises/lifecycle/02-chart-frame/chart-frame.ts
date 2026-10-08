import { Component, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { TickCalculator } from './tick-calculator';

@Component({
  selector: 'app-chart-frame',
  template: `
    <div #plot class="plot"></div>
    @if (showLegend()) {
      <ul class="legend" aria-live="polite">
        <li>Sales</li>
        <li>Returns</li>
      </ul>
    }
    <p data-testid="width">Width: {{ width() }}px</p>
    <ol class="ticks">
      @for (tick of ticks(); track tick) {
        <li>{{ tick }}</li>
      }
    </ol>
  `,
})
export class ChartFrame {
  private readonly calculator = inject(TickCalculator);
  private readonly plot = viewChild.required<ElementRef<HTMLElement>>('plot');

  readonly showLegend = input(false);

  protected readonly width = signal(0);
  protected readonly ticks = computed(() => this.calculator.ticks(this.width()));

  constructor() {
    afterNextRender({ read: () => this.width.set(this.plot().nativeElement.offsetWidth) });
  }
}
