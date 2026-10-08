import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { SEED_PRODUCTS } from '../../../core/fake-backend';
import { Product } from '../../../core/models';
import { ProductApi } from '../../../core/product-api';
import { QuickSearch } from './quick-search';

const keyboard = SEED_PRODUCTS[0];
const mouse = SEED_PRODUCTS[3];

describe('S4 - QuickSearch', () => {
  const api = { search: vi.fn() };
  let fixture: ComponentFixture<QuickSearch>;
  const host = () => fixture.nativeElement as HTMLElement;
  const rows = () => [...host().querySelectorAll('li')].map((li) => li.textContent);

  function type(value: string) {
    const input = host().querySelector('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function wait(ms: number) {
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    api.search.mockReset();
    api.search.mockReturnValue(of([]));
    TestBed.configureTestingModule({ providers: [{ provide: ProductApi, useValue: api }] });
    fixture = TestBed.createComponent(QuickSearch);
    await wait(1000);
  });

  afterEach(() => vi.useRealTimers());

  it('does not call the API before the user types anything', () => {
    expect(api.search).not.toHaveBeenCalled();
    expect(rows()).toEqual([]);
  });

  it('waits for a pause in typing before searching', async () => {
    api.search.mockReturnValue(of([keyboard]));

    type('ke');
    await wait(50);
    type('key');
    await wait(50);
    type('keyb');
    await wait(1000);

    expect(api.search).toHaveBeenCalledTimes(1);
    expect(api.search).toHaveBeenCalledWith('keyb');
    expect(rows()).toEqual([keyboard.name]);
  });

  it('does not search for a single character', async () => {
    type('k');
    await wait(1000);

    expect(api.search).not.toHaveBeenCalled();
  });

  it('shows the results of the latest term even if an older request answers last', async () => {
    const responses: Record<string, Subject<Product[]>> = { ke: new Subject(), mo: new Subject() };
    api.search.mockImplementation((term: string) => responses[term]);

    type('ke');
    await wait(1000);
    type('mo');
    await wait(1000);
    responses['mo'].next([mouse]);
    responses['ke'].next([keyboard]);
    await wait(0);

    expect(rows()).toEqual([mouse.name]);
  });

  it('clears the results when the box is emptied', async () => {
    api.search.mockReturnValue(of([keyboard]));
    type('key');
    await wait(1000);
    expect(rows()).toHaveLength(1);

    type('');
    await wait(1000);

    expect(rows()).toEqual([]);
  });
});
