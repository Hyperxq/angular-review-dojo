import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { ProductSearch } from './product-search';

const keyboard = SEED_PRODUCTS[0];
const mouse = SEED_PRODUCTS[3];

describe('L3 - ProductSearch', () => {
  const api = { search: vi.fn(), update: vi.fn() };
  let fixture: ComponentFixture<ProductSearch>;
  const el = () => fixture.nativeElement as HTMLElement;

  function type(value: string) {
    const input = el().querySelector('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function wait(ms: number) {
    await vi.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  }

  const rows = () => [...el().querySelectorAll('li span:first-child')].map((s) => s.textContent);

  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(api).forEach((fn) => fn.mockReset());
    TestBed.configureTestingModule({ providers: [{ provide: ProductApi, useValue: api }] });
    fixture = TestBed.createComponent(ProductSearch);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('waits for the user to pause typing before searching', async () => {
    api.search.mockReturnValue(of([keyboard]));

    type('k');
    await wait(50);
    type('ke');
    await wait(50);
    type('key');
    await wait(1000);

    expect(api.search).toHaveBeenCalledTimes(1);
    expect(api.search).toHaveBeenCalledWith('key');
  });

  it('does not search again for the same term', async () => {
    api.search.mockReturnValue(of([keyboard]));

    type('key');
    await wait(1000);
    type('key');
    await wait(1000);

    expect(api.search).toHaveBeenCalledTimes(1);
  });

  it('shows the results of the latest search even if an older one answers last', async () => {
    const responses: Record<string, Subject<Product[]>> = { ke: new Subject(), key: new Subject() };
    api.search.mockImplementation((term: string) => responses[term]);

    type('ke');
    await wait(1000);
    type('key');
    await wait(1000);
    responses['key'].next([keyboard]);
    responses['ke'].next([mouse]);
    fixture.detectChanges();

    expect(rows()).toEqual([keyboard.name]);
  });

  it('sends a single update when the button is clicked repeatedly while saving', async () => {
    const update$ = new Subject<Product>();
    api.search.mockReturnValue(of([keyboard]));
    api.update.mockReturnValue(update$);

    type('key');
    await wait(1000);
    const button = el().querySelector('button')!;
    button.click();
    button.click();
    fixture.detectChanges();

    expect(api.update).toHaveBeenCalledTimes(1);

    update$.next({ ...keyboard, price: 80 });
    update$.complete();
    fixture.detectChanges();
    expect(el().querySelector('[role=status]')?.textContent).toContain('Saved');
  });
});
