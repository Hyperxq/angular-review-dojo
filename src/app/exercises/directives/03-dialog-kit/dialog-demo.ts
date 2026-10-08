import { Component, signal } from '@angular/core';
import { Dialog } from './dialog';

@Component({
  selector: 'app-dialog-demo',
  imports: [Dialog],
  template: `
    <button type="button" (click)="open.set(true)">Open settings</button>
    <p id="outside">Page content</p>

    @if (open()) {
      <app-dialog [closeOnOutsideClick]="dismissOnOutside()" (dismiss)="open.set(false)">
        <h3>Settings</h3>
        <button type="button">First option</button>
        <label><input type="checkbox" [checked]="dismissOnOutside()" (change)="dismissOnOutside.set(!dismissOnOutside())" /> Close on outside click</label>
        <button type="button" (click)="advanced.set(!advanced())">Show advanced</button>
        <button type="button" (click)="open.set(false)">Close</button>
        @if (advanced()) {
          <button type="button">Advanced option</button>
        }
      </app-dialog>
    }
  `,
})
export class DialogDemo {
  protected readonly open = signal(false);
  protected readonly advanced = signal(false);
  protected readonly dismissOnOutside = signal(true);
}
