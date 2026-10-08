import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { map, switchMap, timer } from 'rxjs';
import { SkuApi } from './sku-api';

export function skuAvailable(api: SkuApi, debounceMs = 300): AsyncValidatorFn {
  return (control: AbstractControl) =>
    timer(debounceMs).pipe(
      switchMap(() => api.isAvailable(control.value)),
      map((ok): ValidationErrors | null => (ok ? null : { unavailable: true })),
    );
}

export function totalQuantityWithin(max: number): ValidatorFn {
  return (lines: AbstractControl): ValidationErrors | null => {
    const total = (lines.value as { quantity: number }[]).reduce((sum, line) => sum + line.quantity, 0);
    return total > max ? { tooMany: { max, total } } : null;
  };
}
