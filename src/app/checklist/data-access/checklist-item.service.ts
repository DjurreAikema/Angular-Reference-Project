import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {AddChecklistItem, ChecklistItem, EditChecklistItem, RemoveChecklistItem} from '../../shared/interfaces';
import {catchError, EMPTY, map, merge, Subject} from 'rxjs';
import {RemoveChecklist} from '../../shared/interfaces';
import {StorageService} from '../../shared/data-access/storage.service';
import {connect} from 'ngxtension/connect';

export interface ChecklistItemsState {
  checklistItems: ChecklistItem[];
  loaded: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistItemService {
  storageService = inject(StorageService);

  // --- State
  private state = signal<ChecklistItemsState>({
    checklistItems: [],
    loaded: false,
    error: null
  });

  // --- Selectors
  checklistItems = computed(() => this.state().checklistItems);
  loaded = computed(() => this.state().loaded);

  // --- Sources
  add$ = new Subject<AddChecklistItem>();
  edit$ = new Subject<EditChecklistItem>();
  remove$ = new Subject<RemoveChecklistItem>();
  toggle$ = new Subject<RemoveChecklistItem>();
  reset$ = new Subject<RemoveChecklist>();

  checklistRemoved$ = new Subject<RemoveChecklist>()

  private error$ = new Subject<string>();
  private checklistItemsLoaded$ = this.storageService.loadChecklistItems().pipe(
    catchError((err) => {
      this.error$.next(err);
      return EMPTY;
    })
  );

  // --- Reducers
  constructor() {
    const nextState$ = merge(
      // checklistItemsLoaded$ reducer
      this.checklistItemsLoaded$.pipe(
        map((checklistItems) => ({checklistItems, loaded: true}))
      ),
      // error$ reducer
      this.error$.pipe(map((error) => ({error})))
    );

    connect(this.state)
      .with(nextState$)
      // add$ reducer
      .with(this.add$, (state, checklistItem) => ({
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
      // edit$ reducer
      .with(this.edit$, (state, update) => ({
        checklistItems: state.checklistItems.map((item) =>
          item.id === update.id
            ? {...item, title: update.data.title}
            : item
        )
      }))
      // remove$ reducer
      .with(this.remove$, (state, id) => ({
        checklistItems: state.checklistItems.filter((item) => item.id !== id)
      }))
      // toggle$ reducer
      .with(this.toggle$, (state, checklistItemId) => ({
        checklistItems: state.checklistItems.map((item) =>
          item.id === checklistItemId
            ? {...item, checked: !item.checked}
            : item
        )
      }))
      // reset$ reducer
      .with(this.reset$, (state, checklistId) => ({
        checklistItems: state.checklistItems.map((item) =>
          item.checklistId === checklistId
            ? {...item, checked: false}
            : item
        )
      }))
      // checklistRemoved$ reducer
      .with(this.checklistRemoved$, (state, checklistId) => ({
        checklistItems: state.checklistItems.filter(
          (item) => item.checklistId !== checklistId
        )
      }));

    // --- Effects
    effect(() => {
      if (this.loaded()) {
        this.storageService.saveChecklistItems(this.checklistItems());
      }
    });
  }
}


// --- Reducers without Ngxtension
// constructor() {
//   // add$ reducer
//   this.add$.pipe(takeUntilDestroyed()).subscribe((checklistItem) =>
//     this.state.update((state) => ({
//       ...state,
//       checklistItems: [
//         ...state.checklistItems,
//         {
//           ...checklistItem.item,
//           id: Date.now().toString(),
//           checklistId: checklistItem.checklistId,
//           checked: false
//         }
//       ]
//     }))
//   );
//
//   // edit$ reducer
//   this.edit$.pipe(takeUntilDestroyed()).subscribe((update) =>
//     this.state.update((state) => ({
//       ...state,
//       checklistItems: state.checklistItems.map((item) =>
//         item.id === update.id
//           ? {...item, title: update.data.title}
//           : item
//       )
//     }))
//   );
//
//   // remove$ reducer
//   this.remove$.pipe(takeUntilDestroyed()).subscribe((id) =>
//     this.state.update((state) => ({
//       ...state,
//       checklistItems: state.checklistItems.filter(
//         (item) => item.id !== id
//       )
//     }))
//   );
//
//   // toggle$ reducer
//   this.toggle$.pipe(takeUntilDestroyed()).subscribe((checklistItemId) =>
//     this.state.update((state) => ({
//       ...state,
//       checklistItems: state.checklistItems.map((item) =>
//         item.id === checklistItemId
//           ? {...item, checked: !item.checked}
//           : item
//       )
//     }))
//   );
//
//   // reset$ reducer
//   this.reset$.pipe(takeUntilDestroyed()).subscribe((checklistId) =>
//     this.state.update((state) => ({
//       ...state,
//       checklistItems: state.checklistItems.map((item) =>
//         item.checklistId === checklistId
//           ? {...item, checked: false}
//           : item
//       )
//     }))
//   );
//
//   // checklistRemoved$ reducer
//   this.checklistRemoved$.pipe(takeUntilDestroyed()).subscribe((checklistId) =>
//     this.state.update((state) => ({
//       ...state,
//       checklistItems: state.checklistItems.filter(
//         (item) => item.checklistId !== checklistId
//       ),
//     }))
//   );
//
//   // checklistItemsLoaded$ reducer
//   this.checklistItemsLoaded$.pipe(takeUntilDestroyed()).subscribe({
//     next: (checklistItems) =>
//       this.state.update((state) => ({
//         ...state,
//         checklistItems,
//         loaded: true
//       })),
//     error: (err) => this.state.update((state) => ({...state, error: err}))
//   });
//
//   // --- Effects
//   effect(() => {
//     if (this.loaded()) {
//       this.storageService.saveChecklistItems(this.checklistItems());
//     }
//   });
// }
