import { ErrorHandler } from '@angular/core';

export class AppErrorHandler implements ErrorHandler {
  handleError(error: unknown) {
    console.error(error);
  }
}

export function provideAppErrors() {
  return [{ provide: ErrorHandler, useClass: AppErrorHandler }];
}
