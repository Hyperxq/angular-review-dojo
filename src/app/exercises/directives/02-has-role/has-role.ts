import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthState, Role } from './auth-state';

@Directive({ selector: '[appHasRole]' })
export class HasRole {
  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  private readonly auth = inject(AuthState);

  @Input() appHasRoleElse?: TemplateRef<unknown>;

  @Input() set appHasRole(role: Role) {
    if (this.auth.role() === role) {
      this.container.createEmbeddedView(this.template);
    } else if (this.appHasRoleElse) {
      this.container.createEmbeddedView(this.appHasRoleElse);
    }
  }
}
