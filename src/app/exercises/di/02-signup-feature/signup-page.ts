import { Component, computed, inject, signal } from '@angular/core';
import { AUDIT_LOG, LOGGER, USERNAME_VALIDATORS } from './signup-tokens';

@Component({
  selector: 'app-signup-form',
  template: `
    <form (submit)="submit($event)" novalidate>
      <label>
        Username
        <input type="text" [value]="username()" (input)="username.set($any($event.target).value)" />
      </label>
      <button type="submit">Sign up</button>
    </form>
    @if (submitted()) {
      <ul class="errors">
        @for (error of errors(); track error) {
          <li>{{ error }}</li>
        }
      </ul>
    }
  `,
})
export class SignupForm {
  private readonly validators = inject(USERNAME_VALIDATORS);
  private readonly logger = inject(LOGGER);

  protected readonly username = signal('');
  protected readonly submitted = signal(false);
  protected readonly errors = computed(() =>
    this.validators.flatMap((validate) => validate(this.username()) ?? []),
  );

  protected submit(event: Event) {
    event.preventDefault();
    this.submitted.set(true);
    if (this.errors().length === 0) {
      this.logger.log(`signup:${this.username()}`);
    }
  }
}

@Component({
  selector: 'app-audit-panel',
  template: `
    <ul class="audit">
      @for (entry of audit.entries(); track $index) {
        <li>{{ entry }}</li>
      }
    </ul>
  `,
})
export class AuditPanel {
  protected readonly audit = inject(AUDIT_LOG);
}

@Component({
  selector: 'app-signup-page',
  imports: [SignupForm, AuditPanel],
  template: `
    <h2>Create your account</h2>
    <app-signup-form />
    <h3>Audit trail</h3>
    <app-audit-panel />
  `,
})
export class SignupPage {}
