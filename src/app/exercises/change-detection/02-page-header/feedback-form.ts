import { Component } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-feedback-form',
  template: `
    <label [for]="fieldId">Tell us what you think</label>
    <textarea [id]="fieldId" rows="3"></textarea>
    <button type="button">Send</button>
  `,
})
export class FeedbackForm {
  protected readonly fieldId = `feedback-${nextId++}`;
}
