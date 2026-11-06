import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../app.config';
import { FAKE_BACKEND_LATENCY } from '../../../core/fake-backend';

const until = async (condition: () => boolean) => {
  for (let i = 0; i < 100 && !condition(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

describe('Capstone - price alerts in the running app', () => {
  it('creates and lists an alert through the demo backend', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FAKE_BACKEND_LATENCY, useValue: 0 }],
    });
    const harness = await RouterTestingHarness.create('/capstone/01-price-alerts');
    const root = harness.fixture.nativeElement as HTMLElement;
    const listed = () => [...root.querySelectorAll('.alerts li strong')].map((s) => s.textContent);
    const error = () => root.querySelector('p.error')?.textContent ?? null;

    const price = root.querySelector<HTMLInputElement>('input[type=number]')!;
    price.value = '50';
    price.dispatchEvent(new Event('input'));
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await until(() => {
      harness.fixture.detectChanges();
      return listed().length > 0 || error() !== null;
    });

    expect(error()).toBeNull();
    expect(listed()).toEqual(['Keychron K2 Keyboard']);
  });
});
