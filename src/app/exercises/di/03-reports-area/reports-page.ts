import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { AuditLog, Selection } from './shared';

export const reportsScopeInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'X-Reports-Scope': 'finance' } }));

const REPORTS = [
  { id: 1, title: 'Revenue by month' },
  { id: 2, title: 'Refunds' },
  { id: 3, title: 'Stock value' },
];

@Component({
  selector: 'app-reports-page',
  providers: [Selection],
  template: `
    <ul class="reports">
      @for (report of reports; track report.id) {
        <li>
          <button
            type="button"
            [attr.aria-pressed]="selection.ids().includes(report.id)"
            (click)="selection.toggle(report.id)"
          >
            {{ report.title }}
          </button>
        </li>
      }
    </ul>
    <button type="button" class="export" (click)="export()">Export selected</button>
  `,
})
export class ReportsPage {
  private readonly http = inject(HttpClient);
  private readonly audit = inject(AuditLog);
  protected readonly selection = inject(Selection);
  protected readonly reports = REPORTS;

  protected export() {
    this.audit.log(`export:${this.selection.ids().join(',')}`);
    this.http.get('/api/products').subscribe({ error: () => undefined });
  }
}
