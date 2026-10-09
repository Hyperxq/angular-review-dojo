import { Provider, inject } from '@angular/core';
import {
  AUDIT_LOG,
  BufferLogger,
  LOGGER,
  SIGNUP_CONFIG,
  USERNAME_VALIDATORS,
  UsernameValidator,
} from './signup-tokens';

const required: UsernameValidator = (value) => (value.trim() ? null : 'Required');
const minLength =
  (min: number): UsernameValidator =>
  (value) =>
    value.length >= min ? null : `At least ${min} characters`;
const maxLength =
  (max: number): UsernameValidator =>
  (value) =>
    value.length <= max ? null : `At most ${max} characters`;

export function provideSignup(): Provider[] {
  return [
    { provide: USERNAME_VALIDATORS, useValue: required },
    { provide: USERNAME_VALIDATORS, useValue: minLength(3) },
    { provide: USERNAME_VALIDATORS, useFactory: () => maxLength(inject(SIGNUP_CONFIG).maxLength) },
    { provide: LOGGER, useClass: BufferLogger },
    { provide: AUDIT_LOG, useClass: BufferLogger },
  ];
}
