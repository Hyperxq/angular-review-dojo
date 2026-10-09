import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { getByRole } from '../../../core/a11y-queries';
import { ReportsShell } from './reports-shell';
import { AuditLog, traceInterceptor } from './shared';

describe('L3 - reports area', () => {
  let harness: RouterTestingHarness;
  const root = () => harness.fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([traceInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: '',
            component: ReportsShell,
            children: [
              {
                path: '',
                loadChildren: () => import('./reports.routes').then((m) => m.REPORTS_ROUTES),
              },
            ],
          },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create('/');
  });

  const press = async (name: string) => {
    getByRole(root(), 'button', { name }).click();
    await harness.fixture.whenStable();
  };

  it('lists the reports', () => {
    expect(root().querySelectorAll('.reports li')).toHaveLength(3);
  });

  it('sends the area requests through the application interceptors and its own', async () => {
    await press('Export selected');

    const request = TestBed.inject(HttpTestingController).expectOne('/api/products');
    expect(request.request.headers.get('X-Trace-Id')).toBe('t-1');
    expect(request.request.headers.get('X-Reports-Scope')).toBe('finance');
    request.flush([]);
  });

  it('records the export in the application audit log', async () => {
    await press('Revenue by month');
    await press('Stock value');
    await press('Export selected');

    expect(TestBed.inject(AuditLog).entries()).toEqual(['export:1,3']);
    expect(root().querySelector('.audit')?.textContent).toContain('export:1,3');
  });

  it('shows the selection in the header badge', async () => {
    await press('Revenue by month');
    await press('Refunds');

    expect(root().querySelector('.badge')?.textContent).toContain('2 selected');

    await press('Refunds');
    expect(root().querySelector('.badge')?.textContent).toContain('1 selected');
  });
});
