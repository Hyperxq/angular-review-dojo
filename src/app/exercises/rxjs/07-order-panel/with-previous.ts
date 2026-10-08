import { Observable, OperatorFunction } from 'rxjs';

/** Emits `[previous, current]` pairs; `previous` is `undefined` for the first value. */
export function withPrevious<T>(): OperatorFunction<T, [T | undefined, T]> {
  return (source) =>
    new Observable((subscriber) => {
      let previous: T | undefined;
      source.subscribe((value) => {
        subscriber.next([previous, value]);
        previous = value;
      });
    });
}
