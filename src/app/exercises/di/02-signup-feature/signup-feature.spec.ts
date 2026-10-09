import { TestBed } from '@angular/core/testing';
import { provideSignup } from './provide-signup';
import { SignupPage } from './signup-page';
import { SIGNUP_CONFIG } from './signup-tokens';

describe('L2 - signup feature', () => {
  async function render(providers: unknown[] = [provideSignup()]) {
    TestBed.configureTestingModule({ providers: providers as never[] });
    const fixture = TestBed.createComponent(SignupPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const submit = async (username: string) => {
      const input = root.querySelector('input')!;
      input.value = username;
      input.dispatchEvent(new Event('input'));
      root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    };
    const errors = () => [...root.querySelectorAll('.errors li')].map((li) => li.textContent);
    return { root, submit, errors };
  }

  it('works with only provideSignup(), using default settings', async () => {
    const { submit, errors } = await render();

    await submit('x'.repeat(13));

    expect(errors()).toEqual(['At most 12 characters']);
  });

  it('lets the application override the settings', async () => {
    const { submit, errors } = await render([
      provideSignup(),
      { provide: SIGNUP_CONFIG, useValue: { maxLength: 5 } },
    ]);

    await submit('abcdef');

    expect(errors()).toEqual(['At most 5 characters']);
  });

  it('applies every rule and reports all failures together', async () => {
    const { submit, errors } = await render();

    await submit('');
    expect(errors()).toEqual(['Required', 'At least 3 characters']);

    await submit('ab');
    expect(errors()).toEqual(['At least 3 characters']);

    await submit('x'.repeat(13));
    expect(errors()).toEqual(['At most 12 characters']);
  });

  it('accepts a valid username', async () => {
    const { submit, errors } = await render();

    await submit('ana');

    expect(errors()).toEqual([]);
  });

  it('shows in the audit panel what the form logged', async () => {
    const { root, submit } = await render();

    await submit('ana');

    expect(root.querySelector('.audit')?.textContent).toContain('signup:ana');
  });

  it('does not log a failed signup', async () => {
    const { root, submit } = await render();

    await submit('ab');

    expect(root.querySelectorAll('.audit li')).toHaveLength(0);
  });
});
