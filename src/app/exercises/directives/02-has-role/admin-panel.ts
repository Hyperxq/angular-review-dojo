import { Component, inject, signal } from '@angular/core';
import { AuthState, Role } from './auth-state';
import { HasRole } from './has-role';

@Component({
  selector: 'app-admin-panel',
  imports: [HasRole],
  template: `
    <p>Signed in as {{ auth.role() }}</p>
    <button type="button" (click)="auth.role.set('admin')">Become admin</button>
    <button type="button" (click)="auth.role.set('guest')">Sign out</button>

    <section *appHasRole="'admin'; else denied" data-testid="tools">Admin tools</section>
    <ng-template #denied><p data-testid="denied">Access denied</p></ng-template>

    <button type="button" (click)="requiredRole.set('admin')">Require admin</button>
    <section *appHasRole="requiredRole()" data-testid="section">Restricted section</section>
  `,
})
export class AdminPanel {
  protected readonly auth = inject(AuthState);
  protected readonly requiredRole = signal<Role>('editor');
}
