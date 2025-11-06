import {Component, signal} from '@angular/core';
import {ModalComponent} from '../shared/ui/modal.component';
import {Checklist} from '../shared/interfaces';

@Component({
  selector: 'app-home',
  imports: [
    ModalComponent
  ],
  template: `
    <p>Hello world</p>

    <header>
      <h1>Quicklists</h1>
      <button (click)="checklistBeingEdited.set({})">Add Checklist</button>
    </header>

    <app-modal [isOpen]="!!checklistBeingEdited()">
      <ng-template>You can't see my... yet</ng-template>
    </app-modal>
  `
})
export default class HomeComponent {
  checklistBeingEdited = signal<Partial<Checklist> | null>(null);
}
