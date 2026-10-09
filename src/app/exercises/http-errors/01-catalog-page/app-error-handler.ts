import { ErrorHandler, inject } from '@angular/core';
import { ErrorReporter } from './error-reporter';

export class AppErrorHandler implements ErrorHandler {
  private readonly reporter = inject(ErrorReporter);

  handleError(error: unknown) {
    console.error(error);
    this.reporter.report(error);
  }
}

export function provideAppErrors() {
  return [{ provide: ErrorHandler, useClass: AppErrorHandler }];
}
