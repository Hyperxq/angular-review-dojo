import { Component } from '@angular/core';
import { ClickOutside } from './click-outside';
import { FocusTrap } from './focus-trap';

@Component({
  selector: 'app-dialog',
  hostDirectives: [
    { directive: FocusTrap, inputs: ['enabled'] },
    { directive: ClickOutside, inputs: ['enabled'], outputs: ['clickOutside: dismiss'] },
  ],
  template: `<div role="dialog" aria-modal="true"><ng-content /></div>`,
})
export class Dialog {}
