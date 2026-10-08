import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Route, Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AREA_ROUTES } from './area.routes';
import { ADMIN_ROUTES } from './admin/admin.routes';
import { Session } from './session';

describe('L3 - admin area', () => {
  let harness: RouterTestingHarness;
  let loadAdmin: ReturnType<typeof vi.fn>;
  const text = () => (harness.routeNativeElement as HTMLElement).textContent ?? '';
  const url = () => TestBed.inject(Router).url;
  const click = (label: string) =>
    [...(harness.routeNativeElement as HTMLElement).querySelectorAll('button')]
      .find((b) => b.textContent === label)!
      .click();

  beforeEach(async () => {
    loadAdmin = vi.fn(() => Promise.resolve(ADMIN_ROUTES));
    const routes = AREA_ROUTES.map((r) =>
      r.path === 'admin' ? ({ ...r, children: undefined, loadChildren: loadAdmin } as Route) : r,
    );
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
    harness = await RouterTestingHarness.create();
  });

  it('lets an admin into the dashboard and its children', async () => {
    TestBed.inject(Session).signIn({ name: 'Ada', role: 'admin' });

    await harness.navigateByUrl('/admin');
    expect(text()).toContain('Admin dashboard');

    await harness.navigateByUrl('/admin/users');
    expect(text()).toContain('Manage users');
  });

  it('sends a signed-out visitor to the login page, remembering where they were going', async () => {
    await harness.navigateByUrl('/home');
    await harness.navigateByUrl('/admin/users');

    expect(url()).toBe('/login?returnUrl=%2Fadmin%2Fusers');
    expect(text()).toContain('Sign in');
  });

  it('returns the user to the page they asked for after signing in', async () => {
    await harness.navigateByUrl('/home');
    await harness.navigateByUrl('/admin/users');

    click('Sign in as admin');
    await harness.fixture.whenStable();

    expect(url()).toBe('/admin/users');
    expect(text()).toContain('Manage users');
  });

  it('sends a signed-in customer to the forbidden page', async () => {
    TestBed.inject(Session).signIn({ name: 'Sam', role: 'customer' });

    await harness.navigateByUrl('/admin');

    expect(url()).toBe('/forbidden');
    expect(text()).toContain('do not have access');
  });

  it('does not download the admin code for people who cannot use it', async () => {
    await harness.navigateByUrl('/admin');
    TestBed.inject(Session).signIn({ name: 'Sam', role: 'customer' });
    await harness.navigateByUrl('/admin');

    expect(loadAdmin).not.toHaveBeenCalled();
  });

  it('downloads the admin code once an admin asks for it', async () => {
    TestBed.inject(Session).signIn({ name: 'Ada', role: 'admin' });

    await harness.navigateByUrl('/admin');

    expect(loadAdmin).toHaveBeenCalledTimes(1);
  });

  it('keeps the browser history clean when it redirects', async () => {
    await harness.navigateByUrl('/home');
    await harness.navigateByUrl('/admin');

    const location = TestBed.inject(Location);
    expect(location.path()).toBe('/login?returnUrl=%2Fadmin');
    location.back();
    await harness.fixture.whenStable();

    expect(url()).toBe('/home');
  });

  it('loads the reports page lazily', () => {
    const reports = AREA_ROUTES.find((r) => r.path === 'reports')!;

    expect(reports.component).toBeUndefined();
    expect(reports.loadComponent).toBeTypeOf('function');
  });

  it('protects the reports page like the admin area', async () => {
    await harness.navigateByUrl('/reports');

    expect(url()).toBe('/login?returnUrl=%2Freports');
  });
});
