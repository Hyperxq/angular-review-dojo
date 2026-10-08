import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { AuthState, Role } from './auth-state';

@Directive({ selector: '[appHasRole]' })
export class HasRole {
  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  private readonly auth = inject(AuthState);

  readonly appHasRole = input.required<Role>();
  readonly appHasRoleElse = input<TemplateRef<unknown> | null>(null);

  private readonly allowed = computed(() => this.auth.role() === this.appHasRole());

  constructor() {
    effect(() => {
      const allowed = this.allowed();
      const fallback = this.appHasRoleElse();
      untracked(() => {
        this.container.clear();
        const view = allowed ? this.template : fallback;
        if (view) {
          this.container.createEmbeddedView(view);
        }
      });
    });
  }
}
