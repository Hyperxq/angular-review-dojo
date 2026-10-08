import {
  DestroyRef,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
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
        <div class="card" #card [style.height.px]="cardHeight()">
          {{ region }}<br />{{ summary(region) }}
        </div>
      }
    </div>
  `,
})
export class SalesDashboard {
  private readonly statsService = inject(StatsService);
  private readonly chartHost = viewChild.required<ElementRef<HTMLElement>>('chart');
  private readonly cards = viewChildren<ElementRef<HTMLElement>>('card');
  private chart?: FakeChart;

  readonly series = input.required<number[]>();
  protected readonly filter = signal('');
  protected readonly cardHeight = signal<number | null>(null);

  protected readonly stats = computed(() => this.statsService.compute(this.series()));
  protected readonly visibleRegions = computed(() => {
    const term = this.filter().toLowerCase();
    return REGIONS.filter((region) => region.toLowerCase().includes(term));
  });

  constructor() {
    afterNextRender({
      write: () => {
        this.chart = new FakeChart();
        this.chart.init(this.chartHost().nativeElement);
        this.chart.update(this.series());
      },
      read: () => {
        const heights = this.cards().map((card) => card.nativeElement.offsetHeight);
        this.cardHeight.set(Math.max(0, ...heights));
      },
    });

    effect(() => {
      const data = this.series();
      this.chart?.update(data);
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  protected summary(region: string) {
    return `${region.length * 10} orders`;
  }
}
