import { AfterViewInit, Component, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { FakeChart } from './fake-chart';
import { StatsService } from './stats.service';

const REGIONS = ['North', 'South', 'East', 'West'];

@Component({
  selector: 'app-sales-dashboard',
  template: `
    <h2>Sales</h2>
    <div #chart class="chart"></div>
    <p data-testid="stats">
      mean {{ stats().mean }}, best {{ stats().best }}, volatility {{ stats().volatility }}
    </p>
    <label>Filter regions <input (input)="filter.set($any($event.target).value)" /></label>
    <div class="cards">
      @for (region of visibleRegions(); track region) {
        <div class="card">{{ region }}<br />{{ summary(region) }}</div>
      }
    </div>
  `,
})
export class SalesDashboard implements AfterViewInit {
  private readonly stats_ = inject(StatsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly chartHost = viewChild.required<ElementRef<HTMLElement>>('chart');

  readonly series = input.required<number[]>();
  protected readonly filter = signal('');
  private chart?: FakeChart;

  constructor() {
    effect(() => {
      const data = this.series();
      this.chart = new FakeChart();
      this.chart.init(this.chartHost().nativeElement);
      this.chart.update(data);
    });
  }

  ngAfterViewInit() {
    const cards = [...this.host.nativeElement.querySelectorAll<HTMLElement>('.card')];
    let tallest = 0;
    for (const card of cards) {
      card.style.height = 'auto';
      tallest = Math.max(tallest, card.offsetHeight);
    }
    for (const card of cards) {
      card.style.height = `${tallest}px`;
    }
  }

  protected stats() {
    return this.stats_.compute(this.series());
  }

  protected visibleRegions() {
    const term = this.filter().toLowerCase();
    return REGIONS.filter((region) => region.toLowerCase().includes(term));
  }

  protected summary(region: string) {
    return `${region.length * 10} orders`;
  }
}
