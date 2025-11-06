import {effect, inject, Injectable, linkedSignal} from '@angular/core';
import {AddChecklist, EditChecklist} from '../interfaces';
import {Subject} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {StorageService} from './storage.service';
import {ChecklistItemService} from '../../checklist/data-access/checklist-item.service';

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  storageService = inject(StorageService);
  checklistItemService = inject(ChecklistItemService);

  // --- Sources
  loadedChecklists = this.storageService.loadChecklists();

  add$ = new Subject<AddChecklist>();
  edit$ = new Subject<EditChecklist>();
  remove$ = this.checklistItemService.checklistRemoved$;

  // --- State
  checklists = linkedSignal({
    source: this.loadedChecklists.value,
    computation: (checklists) => checklists ?? []
  })

  // --- Reducers
  constructor() {
    // add$ reducer
    this.add$
      .pipe(takeUntilDestroyed())
      .subscribe((checklist) =>
        this.checklists.update((checklists) => [
          ...checklists,
          this.addIdToChecklist(checklist)
        ])
      );

    // edit$ reducer
    this.edit$
      .pipe(takeUntilDestroyed())
      .subscribe((update) =>
        this.checklists.update((checklists) =>
          checklists.map((checklist) =>
            checklist.id === update.id
              ? {...checklist, title: update.data.title}
              : checklist
          )
        )
      );

    // remove$ reducer
    this.remove$
      .pipe(takeUntilDestroyed())
      .subscribe((id) =>
        this.checklists.update((checklists) =>
          checklists.filter((checklist) => checklist.id !== id)
        )
      );

    // --- Effects
    effect(() => {
      const checklists = this.checklists();
      if (this.loadedChecklists.status() === 'resolved') {
        this.storageService.saveChecklists(checklists);
      }
    });
  }

  // --- Methods
  private addIdToChecklist(checklist: AddChecklist) {
    return {
      ...checklist,
      id: this.generateSlug(checklist.title)
    };
  }

  private generateSlug(title: string) {
    let slug = title.toLowerCase().replace(/\\s+/g, '-');

    const matchingSlugs = this.checklists().find(
      (checklist) => checklist.id === slug
    );

    if (matchingSlugs) {
      slug = slug + Date.now().toString();
    }

    return slug;
  }
}
