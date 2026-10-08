import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, Renderer2, inject, signal } from '@angular/core';

@Component({
  selector: 'app-viewport-info',
  imports: [DatePipe],
  template: `
    <h2>Viewport</h2>
    <p data-testid="size">{{ width() }} x {{ height() }}</p>
    <p data-testid="key">Last key: {{ lastKey() || 'none' }}</p>
    <p data-testid="clock">{{ now() | date: 'mediumTime' }}</p>
  `,
})
export class ViewportInfo implements OnInit, OnDestroy {
  private readonly renderer = inject(Renderer2);

  protected readonly width = signal(window.innerWidth);
  protected readonly height = signal(window.innerHeight);
  protected readonly lastKey = signal('');
  protected readonly now = signal(new Date());

  ngOnInit() {
    window.addEventListener('resize', () => {
      this.width.set(window.innerWidth);
      this.height.set(window.innerHeight);
    });

    this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
      this.lastKey.set(event.key);
    });

    setInterval(() => this.now.set(new Date()), 1000);
  }

  ngOnDestroy() {
    console.debug('ViewportInfo destroyed');
  }
}
