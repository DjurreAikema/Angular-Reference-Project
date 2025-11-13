import {Component, computed, effect, inject, signal} from '@angular/core';
import {ChecklistService} from '../shared/data-access/checklist.service';
import {ActivatedRoute} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {ChecklistHeaderComponent} from './ui/checklist-header.component';
import {ChecklistItemService} from './data-access/checklist-item.service';
import {FormBuilder} from '@angular/forms';
import {ChecklistItem} from '../shared/interfaces';
import {ModalComponent} from '../shared/ui/modal.component';
import {FormModalComponent} from '../shared/ui/form-modal.component';
import {ChecklistItemListComponent} from './ui/checklist-item-list.component';

@Component({
  selector: 'app-checklist',
  imports: [
    ChecklistHeaderComponent,
    ModalComponent,
    FormModalComponent,
    ChecklistItemListComponent
  ],
  template: `
    @if (checklist(); as checklist) {
      <app-checklist-header
        [checklist]="checklist"
        (addItem)="checklistItemBeingEdited.set({})"
        (resetChecklist)="checklistItemService.reset$.next($event)"
      />

      <app-checklist-item-list
        [checklistItems]="checklistItemService.checklistItems()"
        (edit)="checklistItemBeingEdited.set($event)"
        (remove)="checklistItemService.remove$.next($event)"
        (toggle)="checklistItemService.toggle$.next($event)"
      />
    }

    <app-modal [isOpen]="!!checklistItemBeingEdited()">
      <ng-template>
        <app-form-modal
          [title]="
            checklistItemBeingEdited()?.id
                ? 'Edit item'
                : 'Create item'
          "
          [formGroup]="checklistItemForm"
          (save)="
            checklistItemBeingEdited()?.id
              ? checklistItemService.edit$.next({
                  id: checklistItemBeingEdited()!.id!,
                  data: checklistItemForm.getRawValue()
                })
              : checklistItemService.add$.next({
                  item: checklistItemForm.getRawValue(),
                  checklistId: checklist()?.id!
                })
          "
          (close)="checklistItemBeingEdited.set(null)"
        ></app-form-modal>
      </ng-template>
    </app-modal>
  `
})
export default class ChecklistComponent {
  // --- Dependencies
  checklistService = inject(ChecklistService);
  checklistItemService = inject(ChecklistItemService);
  route = inject(ActivatedRoute);
  formBuilder = inject(FormBuilder);

  // --- Properties
  checklistItemBeingEdited = signal<Partial<ChecklistItem> | null>(null);

  params = toSignal(this.route.paramMap);

  checklist = computed(() =>
    this.checklistService
      .checklists()
      .find((checklist) => checklist.id === this.params()?.get('id'))
  );

  checklistItemForm = this.formBuilder.nonNullable.group({
    title: ['']
  });

  // --- Constructor
  constructor() {
    // Trigger loading items when checklistId changes
    effect(() => {
      const checklistId = this.params()?.get('id');
      if (checklistId) {
        this.checklistItemService.checklistId$.next(checklistId);
      }
    });

    // Reset or fill checklistItemForm
    effect(() => {
      const checklistItem = this.checklistItemBeingEdited();
      if (!checklistItem) {
        this.checklistItemForm.reset();
      } else {
        this.checklistItemForm.patchValue({
          title: checklistItem.title
        })
      }
    });
  }
}
