import { TestBed } from '@angular/core/testing';
import { ProfileForm, ProfilePayload } from './profile-form';

describe('L1 - ProfileForm', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(ProfileForm);
    const saved: ProfilePayload[] = [];
    fixture.componentInstance.saved.subscribe((p) => saved.push(p));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = (name: string) => el.querySelector<HTMLInputElement>(`input[formControlName=${name}]`)!;
    const type = async (name: string, value: string) => {
      input(name).value = value;
      input(name).dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const save = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { el, input, type, save, saved };
  };

  it('shows the email read-only', async () => {
    const { input } = await setup();

    expect(input('email').value).toBe('ada@example.com');
    expect(input('email').disabled).toBe(true);
  });

  it('saves every field, including the read-only email', async () => {
    const { type, save, saved } = await setup();
    await type('displayName', 'Ada L');

    await save();

    expect(saved).toEqual([{ email: 'ada@example.com', displayName: 'Ada L', age: 30 }]);
  });

  it('rejects a display name shorter than 3 characters', async () => {
    const { el, type, save, saved } = await setup();
    await type('displayName', 'ab');

    await save();

    expect(saved).toEqual([]);
    expect(el.querySelector('[role=alert]')?.textContent).toContain('at least 3');
  });

  it('rejects an under-age user', async () => {
    const { type, save, saved } = await setup();
    await type('displayName', 'Ada L');
    await type('age', '17');

    await save();

    expect(saved).toEqual([]);
  });

  it('shows what is wrong when saving an empty form', async () => {
    const { el, save, saved } = await setup();

    await save();

    expect(saved).toEqual([]);
    expect(el.querySelector('[role=alert]')).not.toBeNull();
  });
});
