import {computed, Injectable, signal} from '@angular/core';
import {AddChecklistItem, ChecklistItem} from '../../shared/interfaces/checklist-item';
import {Subject} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

export interface ChecklistItemsState {
  checklistItems: ChecklistItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistItemService {

  // --- State
  private state = signal<ChecklistItemsState>({
    checklistItems: []
  });

  // --- Selectors
  checklistItems = computed(() => this.state().checklistItems);

  // --- Sources
  add$ = new Subject<AddChecklistItem>();

  // --- Reducers
  constructor() {
    this.add$.pipe(takeUntilDestroyed()).subscribe((checklistItem) =>
      this.state.update((state) => ({
        ...state,
        checklistItems: [
          ...state.checklistItems,
          {
            ...checklistItem.item,
            id: Date.now().toString(),
            checklistId: checklistItem.checklistId,
            checked: false
          }
        ]
      }))
    );
  }
}
