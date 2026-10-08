import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  inject,
  input,
  signal,
} from '@angular/core';
import { Product } from '../../../core/models';
import { CheckCounter } from './check-counter';

export const NOTE_DELAY_MS = 20;

@Component({
  selector: 'app-eager-card',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h3>Eager</h3>
    <p data-testid="name">{{ product.name }}</p>
    <p data-testid="price">{{ product.price | currency }}</p>
    <p data-testid="note">{{ note }}</p>
    <p>checked <span data-checks>0</span> times{{ counter.tick() }}</p>
    <button type="button" (click)="noteLater()">Set note in setTimeout</button>
  `,
})
export class EagerCard {
  protected readonly counter = new CheckCounter(inject(ElementRef));

  @Input({ required: true }) product!: Product;
  protected note = '';

  protected noteLater() {
    setTimeout(() => (this.note = 'set by timer'), NOTE_DELAY_MS);
  }
}

@Component({
  selector: 'app-onpush-card',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3>OnPush (plain fields)</h3>
    <p data-testid="name">{{ product.name }}</p>
    <p data-testid="price">{{ product.price | currency }}</p>
    <p data-testid="note">{{ note }}</p>
    <p>checked <span data-checks>0</span> times{{ counter.tick() }}</p>
    <button type="button" (click)="noteLater(false)">Set note in setTimeout</button>
    <button type="button" (click)="noteLater(true)">Set note in setTimeout + markForCheck</button>
  `,
})
export class OnPushCard {
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly counter = new CheckCounter(inject(ElementRef));

  @Input({ required: true }) product!: Product;
  protected note = '';

  protected noteLater(markForCheck: boolean) {
    setTimeout(() => {
      this.note = 'set by timer';
      if (markForCheck) {
        this.cdr.markForCheck();
      }
    }, NOTE_DELAY_MS);
  }
}

@Component({
  selector: 'app-signal-card',
  imports: [CurrencyPipe],
  template: `
    <h3>OnPush (signals)</h3>
    <p data-testid="name">{{ product().name }}</p>
    <p data-testid="price">{{ product().price | currency }}</p>
    <p data-testid="note">{{ note() }}</p>
    <p>checked <span data-checks>0</span> times{{ counter.tick() }}</p>
    <button type="button" (click)="noteLater()">Set signal in setTimeout</button>
  `,
})
export class SignalCard {
  protected readonly counter = new CheckCounter(inject(ElementRef));

  readonly product = input.required<Product>();
  protected readonly note = signal('');

  protected noteLater() {
    setTimeout(() => this.note.set('set by timer'), NOTE_DELAY_MS);
  }
}
