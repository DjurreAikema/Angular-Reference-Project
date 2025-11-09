import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {AddChecklist, Checklist, EditChecklist} from '../interfaces';
import {catchError, EMPTY, map, merge, Subject} from 'rxjs';
import {StorageService} from './storage.service';
import {ChecklistItemService} from '../../checklist/data-access/checklist-item.service';
import {connect} from 'ngxtension/connect';

export interface ChecklistsState {
  checklists: Checklist[];
  loaded: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  storageService = inject(StorageService);
  checklistItemService = inject(ChecklistItemService);

  // --- State
  private state = signal<ChecklistsState>({
    checklists: [],
    loaded: false,
    error: null
  });

  // --- Selectors
  checklists = computed(() => this.state().checklists);
  loaded = computed(() => this.state().loaded);

  // --- Sources
  add$ = new Subject<AddChecklist>();
  edit$ = new Subject<EditChecklist>();
  remove$ = this.checklistItemService.checklistRemoved$;

  private error$ = new Subject<string>();
  private checklistsLoaded$ = this.storageService.loadChecklists().pipe(
    catchError((err) => {
      this.error$.next(err);
      return EMPTY;
    })
  );

  // --- Reducers
  constructor() {
    const nextState$ = merge(
      // checklistsLoaded$ reducer
      this.checklistsLoaded$.pipe(
        map((checklists) => ({checklists, loaded: true}))
      ),
      // error$ reducer
      this.error$.pipe(map((error) => ({error})))
    );

    connect(this.state)
      .with(nextState$)
      // add$ reducer
      .with(this.add$, (state, checklist) => ({
        checklists: [...state.checklists, this.addIdToChecklist(checklist)]
      }))
      // edit$ reducer
      .with(this.edit$, (state, update) => ({
        checklists: state.checklists.map((checklist) =>
          checklist.id === update.id
            ? {...checklist, title: update.data.title}
            : checklist
        )
      }))
      // remove$ reducer
      .with(this.remove$, (state, id) => ({
        checklists: state.checklists.filter((checklist) => checklist.id !== id)
      }));

    // --- Effects
    effect(() => {
      if (this.loaded()) {
        this.storageService.saveChecklists(this.checklists());
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

// --- Reducers without Ngxtension
// constructor() {
//   // add$ reducer
//   this.add$.pipe(takeUntilDestroyed()).subscribe((checklist) =>
//     this.state.update((state) => ({
//       ...state,
//       checklists: [...state.checklists, this.addIdToChecklist(checklist)]
//     }))
//   );
//
//   // edit$ reducer
//   this.edit$.pipe(takeUntilDestroyed()).subscribe((update) =>
//     this.state.update((state) => ({
//       ...state,
//       checklists: state.checklists.map((checklist) =>
//         checklist.id === update.id
//           ? {...checklist, title: update.data.title}
//           : checklist
//       )
//     }))
//   );
//
//   // remove$ reducer
//   this.remove$.pipe(takeUntilDestroyed()).subscribe((id) =>
//     this.state.update((state) => ({
//       ...state,
//       checklists: state.checklists.filter((checklist) => checklist.id !== id)
//     }))
//   );
//
//   // checklistsLoaded$ reducer
//   this.checklistsLoaded$.pipe(takeUntilDestroyed()).subscribe({
//     next: (checklists) =>
//       this.state.update((state) => ({
//         ...state,
//         checklists,
//         loaded: true
//       })),
//     error: (err) => this.state.update((state) => ({...state, error: err}))
//   });
//
//   // --- Effects
//   effect(() => {
//     if (this.loaded()) {
//       this.storageService.saveChecklists(this.checklists());
//     }
//   });
// }
