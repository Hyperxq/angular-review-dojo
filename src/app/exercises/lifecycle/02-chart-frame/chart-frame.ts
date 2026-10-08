import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { TickCalculator } from './tick-calculator';

@Component({
  selector: 'app-chart-frame',
  template: `
    <div #plot class="plot"></div>
    @if (showLegend) {
      <ul #legend class="legend">
        <li>Sales</li>
        <li>Returns</li>
      </ul>
    }
    <p data-testid="width">Width: {{ width }}px</p>
    <ol class="ticks">
      @for (tick of ticks; track tick) {
        <li>{{ tick }}</li>
      }
    </ol>
  `,
})
export class ChartFrame implements OnInit, AfterViewInit, AfterViewChecked {
  private readonly calculator = inject(TickCalculator);

  @Input() showLegend = false;
  @ViewChild('plot') plot!: ElementRef<HTMLElement>;
  @ViewChild('legend') legend?: ElementRef<HTMLElement>;

  protected width = 0;
  protected ticks: number[] = [];

  ngOnInit() {
    this.legend?.nativeElement.setAttribute('aria-live', 'polite');
  }

  ngAfterViewInit() {
    this.width = this.plot.nativeElement.offsetWidth;
  }

  ngAfterViewChecked() {
    this.ticks = this.calculator.ticks(this.width);
  }
}
