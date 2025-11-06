import {Component, input, output} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {KeyValuePipe} from '@angular/common';

@Component({
  selector: 'app-form-modal',
  imports: [
    ReactiveFormsModule,
    KeyValuePipe
  ],
  template: `
    <header>
      <h2>{{ title() }}</h2>
      <button (click)="close.emit()">close</button>
    </header>

    <section>
      <form [formGroup]="formGroup()" (ngSubmit)="save.emit(); close.emit()">
        @for (control of formGroup().controls | keyvalue; track control.key) {
          <div>
            <label [for]="control.key">{{ control.key }}</label>
            <input
              [id]="control.key"
              type="text"
              [formControlName]="control.key"
            />
          </div>
        }
        <button type="submit">Save</button>
      </form>
    </section>
  `
})
export class FormModalComponent {
  title = input.required<string>();
  formGroup = input.required<FormGroup>();

  save = output();
  close = output();
}

// The idea here is that this component will be given a FormGroup which contains form controls (e.g. we might have a username form control).
// The keyvalue pipe will allow us to access the key and value in these control objects. The idea is that we want to use the key,
// which is actually the name of the form control, and assign that as the formControlName for the input. In this way, the specific
// inputs we are dynamically rendering out will be correctly associated with their corresponding form control — that means updating
// the input field will update the form control’s value.
