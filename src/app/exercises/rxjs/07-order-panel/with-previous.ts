import { Observable, OperatorFunction } from 'rxjs';

/** Emits `[previous, current]` pairs; `previous` is `undefined` for the first value. */
export function withPrevious<T>(): OperatorFunction<T, [T | undefined, T]> {
  return (source) =>
    new Observable((subscriber) => {
      let previous: T | undefined;
      return source.subscribe({
        next: (value) => {
          subscriber.next([previous, value]);
          previous = value;
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });
    });
}
