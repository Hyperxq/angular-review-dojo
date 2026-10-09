import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { retry } from 'rxjs';
import { NewAlert, PriceAlert } from './alert.models';

@Service()
export class AlertsApi {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<PriceAlert[]>('/api/alerts');
  }

  search(term: string) {
    return this.http.get<PriceAlert[]>('/api/alerts', { params: { product: term } });
  }

  create(alert: NewAlert) {
    return this.http.post<PriceAlert>('/api/alerts', alert).pipe(retry(3));
  }

  remove(id: number) {
    return this.http.delete<void>(`/api/alerts/${id}`);
  }
}
