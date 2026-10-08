import { TestBed } from '@angular/core/testing';
import { AdminPanel } from './admin-panel';
import { AuthState, Role } from './auth-state';

describe('L2 - HasRole structural directive', () => {
  const setup = async (role: Role = 'guest') => {
    TestBed.inject(AuthState).role.set(role);
    const fixture = TestBed.createComponent(AdminPanel);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const count = (id: string) => el.querySelectorAll(`[data-testid=${id}]`).length;
    const click = async (label: string) => {
      [...el.querySelectorAll('button')].find((b) => b.textContent === label)!.click();
      await fixture.whenStable();
    };
    return { fixture, el, count, click, auth: TestBed.inject(AuthState) };
  };

  it('shows the protected section to a user who has the role from the start', async () => {
    const { count } = await setup('admin');

    expect(count('tools')).toBe(1);
    expect(count('denied')).toBe(0);
  });

  it('shows the fallback to a visitor without the role', async () => {
    const { count } = await setup();

    expect(count('tools')).toBe(0);
    expect(count('denied')).toBe(1);
  });

  it('shows the protected section, once, to a user with the role', async () => {
    const { auth, fixture, count } = await setup();

    auth.role.set('admin');
    await fixture.whenStable();

    expect(count('tools')).toBe(1);
    expect(count('denied')).toBe(0);
  });

  it('follows the user signing in and out', async () => {
    const { count, click } = await setup();

    await click('Become admin');
    expect(count('tools')).toBe(1);

    await click('Sign out');
    expect(count('tools')).toBe(0);
    expect(count('denied')).toBe(1);
  });

  it('never accumulates copies when the role flips back and forth', async () => {
    const { count, click } = await setup();

    for (let i = 0; i < 3; i++) {
      await click('Become admin');
      await click('Sign out');
    }
    await click('Become admin');

    expect(count('tools')).toBe(1);
    expect(count('denied')).toBe(0);
  });

  it('re-evaluates when the required role changes', async () => {
    const { count, click } = await setup('editor');
    expect(count('section')).toBe(1);

    await click('Require admin');
    expect(count('section')).toBe(0);
  });
});
