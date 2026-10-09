import { DOCUMENT } from '@angular/common';
import { Component, afterNextRender, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-preferences',
  template: `
    <h2>Preferences</h2>
    <label>
      <input type="checkbox" [checked]="dark()" (change)="toggle()" />
      Dark mode
    </label>
    <p class="viewport">Viewport: {{ width() ?? '…' }}px</p>
  `,
  host: { '(window:resize)': 'onResize()' },
})
export class Preferences {
  private readonly document = inject(DOCUMENT);

  protected readonly dark = signal(false);
  protected readonly width = signal<number | null>(null);

  constructor() {
    inject(Title).setTitle('Preferences');
    afterNextRender(() => {
      const stored = localStorage.getItem('theme');
      this.setDark(
        stored === null
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : stored === 'dark',
      );
      this.onResize();
    });
  }

  protected toggle() {
    this.setDark(!this.dark());
    localStorage.setItem('theme', this.dark() ? 'dark' : 'light');
  }

  protected onResize() {
    this.width.set(this.document.defaultView?.innerWidth ?? null);
  }

  private setDark(dark: boolean) {
    this.dark.set(dark);
    this.document.documentElement.classList.toggle('dark', dark);
  }
}
