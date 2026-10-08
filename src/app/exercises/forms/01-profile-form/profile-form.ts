import { Component, output } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

export interface ProfilePayload {
  email: string;
  displayName: string;
  age: number;
}

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  template: `
    <h2>Your profile</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>Email <input formControlName="email" /></label>
      <label>Display name <input formControlName="displayName" /></label>
      @if (form.get('displayName')?.touched && form.get('displayName')?.invalid) {
        <p role="alert">Display name must have at least 3 characters.</p>
      }
      <label>Age <input type="number" formControlName="age" /></label>
      <button type="submit">Save</button>
    </form>
  `,
})
export class ProfileForm {
  readonly saved = output<ProfilePayload>();

  protected readonly form = new UntypedFormGroup({
    email: new UntypedFormControl({ value: 'ada@example.com', disabled: true }),
    displayName: new UntypedFormControl('', [Validators.required, Validators.min(3)]),
    age: new UntypedFormControl(30, [Validators.required, Validators.min(18)]),
  });

  protected submit() {
    if (this.form.invalid) {
      return;
    }
    this.saved.emit(this.form.value);
  }
}
