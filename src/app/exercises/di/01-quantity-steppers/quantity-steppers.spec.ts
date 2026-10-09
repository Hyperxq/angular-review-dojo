import { TestBed } from '@angular/core/testing';
import { Analytics } from './analytics';
import { SteppersDemo } from './steppers-demo';

describe('L1 - quantity steppers', () => {
  async function render() {
    const fixture = TestBed.createComponent(SteppersDemo);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const steppers = [...root.querySelectorAll('app-quantity-stepper')];
    const value = (i: number) => steppers[i].querySelector('output')!.textContent;
    const press = async (i: number, button: 'inc' | 'dec' | 'reset') => {
      steppers[i].querySelector<HTMLButtonElement>(`.${button}`)!.click();
      await fixture.whenStable();
    };
    return { value, press };
  }

  it('starts every stepper at 1', async () => {
    const { value } = await render();

    expect([value(0), value(1)]).toEqual(['1', '1']);
  });

  it('counts each stepper on its own', async () => {
    const { value, press } = await render();

    await press(0, 'inc');
    await press(0, 'inc');
    await press(1, 'inc');

    expect([value(0), value(1)]).toEqual(['3', '2']);
  });

  it('never goes below 1', async () => {
    const { value, press } = await render();

    await press(0, 'dec');

    expect(value(0)).toBe('1');
  });

  it('resets one stepper and records the event', async () => {
    const { value, press } = await render();
    await press(0, 'inc');
    await press(1, 'inc');

    await press(0, 'reset');

    expect([value(0), value(1)]).toEqual(['1', '2']);
    expect(TestBed.inject(Analytics).events).toEqual(['stepper-reset:Keychron K2 Keyboard']);
  });
});
