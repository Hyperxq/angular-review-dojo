import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: { '[style.backgroundColor]': 'color()' },
})
export class Highlight {
  readonly color = input('#fff3a3');
}
