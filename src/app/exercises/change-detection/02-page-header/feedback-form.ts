import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-feedback-form',
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <label [for]="fieldId">Tell us what you think</label>
    <textarea [id]="fieldId" rows="3"></textarea>
    <button type="button">Send</button>
  `,
})
export class FeedbackForm {
  private seq = 0;

  protected get fieldId() {
    return `feedback-${++this.seq}`;
  }
}
