import { Title } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AdminTitleStrategy } from './admin-title-strategy';
import { ADMIN_ROUTES } from './admin.routes';

describe('L5 - catalog admin', () => {
  let harness: RouterTestingHarness;
  let confirmSpy: ReturnType<typeof vi.spyOn>;
  const root = () => harness.routeNativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const url = () => TestBed.inject(Router).url;
  const click = async (selector: string, label: string) => {
    [...root().querySelectorAll<HTMLElement>(selector)].find((e) => e.textContent?.includes(label))!.click();
    await harness.fixture.whenStable();
  };
  const type = async (value: string) => {
    const input = root().querySelector('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
  };

  beforeEach(async () => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(ADMIN_ROUTES, withComponentInputBinding()),
        { provide: TitleStrategy, useExisting: AdminTitleStrategy },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => confirmSpy.mockRestore());

  it('redirects the empty path to the dashboard', async () => {
    await harness.navigateByUrl('/');

    expect(url()).toBe('/dashboard');
  });

  it('keeps the draft when switching between the tabs', async () => {
    confirmSpy.mockReturnValue(true);
    await harness.navigateByUrl('/products');
    await type('Keychron Q1');

    await click('a', 'Pricing');
    expect(text()).toContain('Pricing for Keychron Q1');

    await click('a', 'General');
    expect(root().querySelector('input')!.value).toBe('Keychron Q1');
  });

  it('does not ask for confirmation when only switching tabs', async () => {
    await harness.navigateByUrl('/products');
    await type('Keychron Q1');

    await click('a', 'Pricing');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(url()).toBe('/products/pricing');
  });

  it('lets the user leave without asking when nothing changed', async () => {
    await harness.navigateByUrl('/products/general');

    await harness.navigateByUrl('/dashboard');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(url()).toBe('/dashboard');
  });

  it('lets the user leave without asking after saving', async () => {
    await harness.navigateByUrl('/products/general');
    await type('Keychron Q1');
    await click('button', 'Save');

    await harness.navigateByUrl('/dashboard');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(url()).toBe('/dashboard');
  });

  it('stays on the editor when the user declines to discard changes', async () => {
    await harness.navigateByUrl('/products/general');
    await type('Keychron Q1');

    await harness.navigateByUrl('/dashboard');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(url()).toBe('/products/general');
  });

  it('leaves the editor when the user agrees to discard changes', async () => {
    confirmSpy.mockReturnValue(true);
    await harness.navigateByUrl('/products/general');
    await type('Keychron Q1');

    await harness.navigateByUrl('/dashboard');

    expect(url()).toBe('/dashboard');
  });

  it('opens the help panel in the side outlet', async () => {
    await harness.navigateByUrl('/dashboard');

    await click('a', 'Help');

    expect(root().querySelector('aside')!.textContent).toContain('Keyboard shortcuts');
    expect(text()).toContain('Dashboard');
  });

  it('titles every page, including the ones without a title', async () => {
    const title = TestBed.inject(Title);

    await harness.navigateByUrl('/products/pricing');
    expect(title.getTitle()).toBe('Pricing | Admin');

    await harness.navigateByUrl('/dashboard');
    expect(title.getTitle()).toBe('Admin');
  });
});
