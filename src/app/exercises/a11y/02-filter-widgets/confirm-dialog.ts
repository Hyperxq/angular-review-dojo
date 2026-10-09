import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
let nextId = 0;

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (open()) {
      <div class="backdrop">
        <div
          #dialog
          class="dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          (keydown)="onKeydown($event)"
        >
          <h3 [id]="titleId">{{ title() }}</h3>
          <ng-content />
          <button type="button" (click)="open.set(false)">Cancel</button>
          <button type="button" (click)="confirm()">Delete</button>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private opener: HTMLElement | null = null;

  readonly title = input.required<string>();
  readonly open = model(false);
  readonly confirmed = output<void>();

  protected readonly titleId = `confirm-dialog-title-${nextId++}`;

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (dialog) {
        this.opener = this.document.activeElement as HTMLElement | null;
        dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      } else if (this.opener) {
        this.opener.focus();
        this.opener = null;
      }
    });
  }

  protected confirm() {
    this.confirmed.emit();
    this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.open.set(false);
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const items = this.dialog()!.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = items[0];
    const last = items[items.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
