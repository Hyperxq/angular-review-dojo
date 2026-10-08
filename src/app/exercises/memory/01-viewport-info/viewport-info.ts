import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-viewport-info',
  imports: [DatePipe],
  host: {
    '(window:resize)': 'measure()',
    '(document:keydown)': 'lastKey.set($event.key)',
  },
  template: `
    <h2>Viewport</h2>
    <p data-testid="size">{{ width() }} x {{ height() }}</p>
    <p data-testid="key">Last key: {{ lastKey() || 'none' }}</p>
    <p data-testid="clock">{{ now() | date: 'mediumTime' }}</p>
  `,
})
export class ViewportInfo {
  protected readonly width = signal(window.innerWidth);
  protected readonly height = signal(window.innerHeight);
  protected readonly lastKey = signal('');
  protected readonly now = signal(new Date());

  constructor() {
    const clock = setInterval(() => this.now.set(new Date()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(clock));
  }

  protected measure() {
    this.width.set(window.innerWidth);
    this.height.set(window.innerHeight);
  }
}
