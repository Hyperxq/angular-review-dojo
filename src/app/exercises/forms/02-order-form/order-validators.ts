import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { map } from 'rxjs';
import { SkuApi } from './sku-api';

export function skuAvailable(api: SkuApi): AsyncValidatorFn {
  return (control: AbstractControl) =>
    api.isAvailable(control.value).pipe(map((ok): ValidationErrors | null => (ok ? null : { unavailable: true })));
}
