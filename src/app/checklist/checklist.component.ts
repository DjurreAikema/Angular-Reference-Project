import {Component, computed, inject} from '@angular/core';
import {ChecklistService} from '../shared/data-access/checklist.service';
import {ActivatedRoute} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {ChecklistHeaderComponent} from './ui/checklist-header.component';

@Component({
  selector: 'app-checklist',
  imports: [
    ChecklistHeaderComponent
  ],
  template: `
    @if (checklist(); as checklist) {
      <app-checklist-header [checklist]="checklist"/>
    }
  `
})
export default class ChecklistComponent {
  checklistService = inject(ChecklistService);
  route = inject(ActivatedRoute);

  params = toSignal(this.route.paramMap);

  checklist = computed(() =>
    this.checklistService
      .checklists()
      .find((checklist) => checklist.id === this.params()?.get('id'))
  );
}
