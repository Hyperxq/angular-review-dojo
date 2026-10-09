import { Service } from '@angular/core';

@Service()
export class ErrorReporter {
  readonly reports: unknown[] = [];

  report(error: unknown) {
    this.reports.push(error);
  }
}
