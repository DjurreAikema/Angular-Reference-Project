import {effect, inject, Injectable, linkedSignal} from '@angular/core';
import {AddChecklistItem, EditChecklistItem, RemoveChecklistItem} from '../../shared/interfaces';
import {Subject} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RemoveChecklist} from '../../shared/interfaces';
import {StorageService} from '../../shared/data-access/storage.service';

@Injectable({
  providedIn: 'root'
})
export class ChecklistItemService {
  storageService = inject(StorageService);

  // --- Sources
  loadedChecklistItems = this.storageService.loadChecklistItems();

  add$ = new Subject<AddChecklistItem>();
  edit$ = new Subject<EditChecklistItem>();
  remove$ = new Subject<RemoveChecklistItem>();
  toggle$ = new Subject<RemoveChecklistItem>();
  reset$ = new Subject<RemoveChecklist>();

  checklistRemoved$ = new Subject<RemoveChecklist>()

  // --- State
  checklistItems = linkedSignal({
    source: this.loadedChecklistItems.value,
    computation: (checklistItems) => checklistItems ?? []
  });

  // --- Reducers
  constructor() {
    // add$ reducer
    this.add$
      .pipe(takeUntilDestroyed())
      .subscribe((checklistItem) =>
        this.checklistItems.update((checklistItems) => [
          ...checklistItems,
          {
            ...checklistItem.item,
            id: Date.now().toString(),
            checklistId: checklistItem.checklistId,
            checked: false
          }
        ])
      );

    // edit$ reducer
    this.edit$
      .pipe(takeUntilDestroyed())
      .subscribe((update) =>
        this.checklistItems.update((checklistItems) =>
          checklistItems.map((item) =>
            item.id === update.id
              ? {...item, title: update.data.title}
              : item
          )
        )
      );

    // remove$ reducer
    this.remove$
      .pipe(takeUntilDestroyed())
      .subscribe((id) =>
        this.checklistItems.update((checklistItems) =>
          checklistItems.filter(
            (item) => item.id !== id
          )
        )
      );

    // toggle$ reducer
    this.toggle$
      .pipe(takeUntilDestroyed())
      .subscribe((checklistItemId) =>
        this.checklistItems.update((checklistItems) =>
          checklistItems.map((item) =>
            item.id === checklistItemId
              ? {...item, checked: !item.checked}
              : item
          )
        )
      );

    // reset$ reducer
    this.reset$
      .pipe(takeUntilDestroyed())
      .subscribe((checklistId) =>
        this.checklistItems.update((checklistItems) =>
          checklistItems.map((item) =>
            item.checklistId === checklistId
              ? {...item, checked: false}
              : item
          )
        )
      );

    // checklistRemoved$ reducer
    this.checklistRemoved$
      .pipe(takeUntilDestroyed())
      .subscribe((checklistId) =>
        this.checklistItems.update((checklistItems) =>
          checklistItems.filter(
            (item) => item.checklistId !== checklistId
          ),
        )
      );

    // --- Effects
    effect(() => {
      const checklistItems = this.checklistItems();
      if (this.loadedChecklistItems.status() === 'resolved') {
        this.storageService.saveChecklistItems(checklistItems);
      }
    });
  }
}
