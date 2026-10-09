import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-preferences',
  template: `
    <h2>Preferences</h2>
    <label>
      <input type="checkbox" [checked]="dark()" (change)="toggle()" />
      Dark mode
    </label>
    <p class="viewport">Viewport: {{ width() }}px</p>
  `,
  host: { '(window:resize)': 'onResize()' },
})
export class Preferences {
  protected readonly dark = signal(
    localStorage.getItem('theme') === 'dark' ||
      (localStorage.getItem('theme') === null &&
        window.matchMedia('(prefers-color-scheme: dark)').matches),
  );
  protected readonly width = signal(window.innerWidth);

  constructor() {
    document.title = 'Preferences';
    document.documentElement.classList.toggle('dark', this.dark());
  }

  protected toggle() {
    this.dark.update((dark) => !dark);
    localStorage.setItem('theme', this.dark() ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', this.dark());
  }

  protected onResize() {
    this.width.set(window.innerWidth);
  }
}
