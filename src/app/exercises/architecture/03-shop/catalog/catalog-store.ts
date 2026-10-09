import { Service, computed, signal } from '@angular/core';
import { SEED_PRODUCTS } from '../../../../core/fake-backend';

@Service()
export class CatalogStore {
  readonly query = signal('');
  readonly visible = computed(() => {
    const term = this.query().toLowerCase();
    return SEED_PRODUCTS.filter((p) => p.name.toLowerCase().includes(term));
  });
}
