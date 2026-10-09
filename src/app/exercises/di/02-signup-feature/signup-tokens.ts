import { InjectionToken, Service, signal } from '@angular/core';

export interface SignupConfig {
  maxLength: number;
}

export type UsernameValidator = (value: string) => string | null;

@Service({ autoProvided: false })
export class BufferLogger {
  readonly entries = signal<string[]>([]);

  log(message: string) {
    this.entries.update((entries) => [...entries, message]);
  }
}

export const SIGNUP_CONFIG = new InjectionToken<SignupConfig>('SIGNUP_CONFIG');
export const USERNAME_VALIDATORS = new InjectionToken<UsernameValidator[]>('USERNAME_VALIDATORS');
export const LOGGER = new InjectionToken<BufferLogger>('LOGGER');
export const AUDIT_LOG = new InjectionToken<BufferLogger>('AUDIT_LOG');
