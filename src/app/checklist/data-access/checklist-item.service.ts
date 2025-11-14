import {computed, inject, Injectable, signal} from '@angular/core';
import {AddChecklistItem, ChecklistItem, ChecklistItemMapper, EditChecklistItem, RemoveChecklistItem} from '../../shared/interfaces';
import {map, merge, Observable, Subject, switchMap} from 'rxjs';
import {RemoveChecklist} from '../../shared/interfaces';
import {connect} from 'ngxtension/connect';
import {HttpClient} from '@angular/common/http';
import {ApiService} from '../../shared/data-access/api.service';
import {catchErrorWithMessage, mapDto, mapDtoArray} from '../../shared/operators';

export interface ChecklistItemsState {
  checklistItems: ChecklistItem[];
  loaded: boolean;
  error: string | null;
  currentChecklistId: string | null;
}

interface ChecklistItemDto {
  id: string;
  checklistId: string;
  title: string;
  checked: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistItemService {
  private _http = inject(HttpClient);
  private _api = inject(ApiService);

  // --- State
  private state = signal<ChecklistItemsState>({
    checklistItems: [],
    loaded: false,
    error: null,
    currentChecklistId: null
  });

  // --- Selectors
  checklistItems = computed(() => this.state().checklistItems);
  loaded = computed(() => this.state().loaded);
  error = computed(() => this.state().error);
  currentChecklistId = computed(() => this.state().currentChecklistId);

  // --- Sources
  checklistId$ = new Subject<string>();

  add$ = new Subject<AddChecklistItem>();
  edit$ = new Subject<EditChecklistItem>();
  remove$ = new Subject<RemoveChecklistItem>();
  toggle$ = new Subject<RemoveChecklistItem>();
  reset$ = new Subject<RemoveChecklist>();

  private error$ = new Subject<string>();

  private itemsLoaded$: Observable<{ items: ChecklistItem[], checklistId: string }> = this.checklistId$.pipe(
    switchMap(checklistId =>
      this._http.get<ChecklistItemDto[]>(
        this._api.getUrl(`/checklists/${checklistId}/items`)
      ).pipe(
        mapDtoArray(ChecklistItemMapper.fromDto, 'Failed to map checklist items from API'),
        map(items => ({items, checklistId})),
        catchErrorWithMessage(this.error$, "Failed to load checklist items")
      )
    )
  );

  private itemAdded$: Observable<ChecklistItem> = this.add$.pipe(
    switchMap(({item, checklistId}) =>
      this._http.post<ChecklistItemDto>(
        this._api.getUrl(`/checklists/${checklistId}/items`),
        {title: item.title}
      ).pipe(
        mapDto(ChecklistItemMapper.fromDto, 'Failed to map created item from API'),
        catchErrorWithMessage(this.error$, "Failed to add item")
      )
    )
  );

  private itemEdited$: Observable<ChecklistItem> = this.edit$.pipe(
    switchMap(update =>
      this._http.put<ChecklistItemDto>(
        this._api.getUrl(`/items/${update.id}`),
        {title: update.data.title}
      ).pipe(
        mapDto(ChecklistItemMapper.fromDto, 'Failed to map updated item from API'),
        catchErrorWithMessage(this.error$, "Failed to edit item")
      )
    )
  );

  private itemToggled$: Observable<RemoveChecklistItem> = this.toggle$.pipe(
    switchMap(id =>
      this._http.patch<ChecklistItemDto>(
        this._api.getUrl(`/items/${id}/toggle`), {}
      ).pipe(
        map(dto => dto.id),
        catchErrorWithMessage(this.error$, "Failed to toggle item")
      )
    )
  );

  private itemRemoved$: Observable<RemoveChecklistItem> = this.remove$.pipe(
    switchMap(id =>
      this._http.delete(
        this._api.getUrl(`/items/${id}`)
      ).pipe(
        map(() => id),
        catchErrorWithMessage(this.error$, "Failed to delete item")
      )
    )
  );

  private itemReset$: Observable<RemoveChecklist> = this.reset$.pipe(
    switchMap(checklistId =>
      this._http.patch(
        this._api.getUrl(`/checklists/${checklistId}/reset`), {}
      ).pipe(
        map(() => checklistId),
        catchErrorWithMessage(this.error$, "Failed to reset item")
      )
    )
  );

  // --- Reducers
  constructor() {
    const nextState$ = merge(
      // checklistItemsLoaded$ reducer
      this.itemsLoaded$.pipe(
        map(({items, checklistId}) => (
          {checklistItems: items, loaded: true, currentChecklistId: checklistId}
        ))
      ),
      // error$ reducer
      this.error$.pipe(map((error) => ({error})))
    );

    connect(this.state)
      .with(nextState$)
      // add$ reducer (itemAdded$)
      .with(this.itemAdded$, (state, item) => ({
        checklistItems: [...state.checklistItems, item]
      }))
      // edit$ reducer (itemEdited$)
      .with(this.itemEdited$, (state, update) => ({
        checklistItems: state.checklistItems.map((item) =>
          item.id === update.id
            ? {...item, title: update.title}
            : item
        )
      }))
      // remove$ reducer 9itemRemoved$)
      .with(this.itemRemoved$, (state, id) => ({
        checklistItems: state.checklistItems.filter((item) => item.id !== id)
      }))
      // toggle$ reducer (itemToggled$)
      .with(this.itemToggled$, (state, id) => ({
        checklistItems: state.checklistItems.map((item) =>
          item.id === id
            ? {...item, checked: !item.checked}
            : item
        )
      }))
      // reset$ reducer (itemReset$)
      .with(this.itemReset$, (state, checklistId) => ({
        checklistItems: state.checklistItems.map((item) =>
          item.checklistId === checklistId
            ? {...item, checked: false}
            : item
        )
      }));
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
