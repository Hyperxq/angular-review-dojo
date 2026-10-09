import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuditLog, Selection } from './shared';

@Component({
  selector: 'app-selection-badge',
  template: `<span class="badge">{{ selection.count() }} selected</span>`,
})
export class SelectionBadge {
  protected readonly selection = inject(Selection);
}

@Component({
  selector: 'app-reports-shell',
  imports: [RouterOutlet, SelectionBadge],
  template: `
    <header>
      <h2>Reports</h2>
      <app-selection-badge />
    </header>
    <router-outlet />
    <h3>Audit trail</h3>
    <ul class="audit">
      @for (entry of audit.entries(); track $index) {
        <li>{{ entry }}</li>
      }
    </ul>
  `,
})
export class ReportsShell {
  protected readonly audit = inject(AuditLog);
}
