import {computed, inject, Injectable, signal} from '@angular/core';
import {AddChecklist, Checklist, ChecklistDto, ChecklistMapper, EditChecklist, RemoveChecklist} from '../interfaces';
import {map, merge, Observable, of, Subject, switchMap} from 'rxjs';
import {connect} from 'ngxtension/connect';
import {HttpClient} from '@angular/common/http';
import {ApiService} from './api.service';
import {catchErrorWithMessage, mapDto, mapDtoArray} from '../operators';

export interface ChecklistsState {
  checklists: Checklist[];
  loaded: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private _http = inject(HttpClient);
  private _api = inject(ApiService);

  // --- State
  private state = signal<ChecklistsState>({
    checklists: [],
    loaded: false,
    error: null
  });

  // --- Selectors
  checklists = computed(() => this.state().checklists);
  loaded = computed(() => this.state().loaded);
  error = computed(() => this.state().error);

  // --- Sources
  add$ = new Subject<AddChecklist>();
  edit$ = new Subject<EditChecklist>();
  remove$ = new Subject<RemoveChecklist>();
  refresh$ = new Subject<void>()

  private error$ = new Subject<string>();

  private checklistsLoaded$: Observable<Checklist[]> = merge(
    of(void 0),
    this.refresh$
  ).pipe(
    switchMap(() =>
      this._http.get<ChecklistDto[]>(this._api.getUrl('/checklists'))
        .pipe(
          mapDtoArray(ChecklistMapper.fromDto, 'Failed to map checklist from API'),
          catchErrorWithMessage(this.error$, "Failed to load checklists")
        )
    )
  )

  private checklistAdded$: Observable<Checklist> = this.add$.pipe(
    switchMap(checklist =>
      this._http.post<ChecklistDto>(
        this._api.getUrl('/checklists'),
        {title: checklist.title}
      ).pipe(
        mapDto(ChecklistMapper.fromDto, 'Failed to map created checklist from API'),
        catchErrorWithMessage(this.error$, "Failed to add checklist")
      )
    )
  );

  private checklistEdited$: Observable<Checklist> = this.edit$.pipe(
    switchMap(update =>
      this._http.put<ChecklistDto>(
        this._api.getUrl(`/checklists/${update.id}`),
        {title: update.data.title}
      ).pipe(
        mapDto(ChecklistMapper.fromDto, 'Failed to map edited checklist from API'),
        catchErrorWithMessage(this.error$, "Failed to edit checklist")
      )
    )
  );

  private checklistRemoved$: Observable<RemoveChecklist> = this.remove$.pipe(
    switchMap(id =>
      this._http.delete(
        this._api.getUrl(`/checklists/${id}`)
      ).pipe(
        map(() => id),
        catchErrorWithMessage(this.error$, "Failed to delete checklist")
      )
    )
  );

  // --- Reducers
  constructor() {
    const nextState$ = merge(
      // refresh$ reducer
      this.refresh$.pipe(
        map(() => ({loaded: false}))
      ),
      // checklistsLoaded$ reducer
      this.checklistsLoaded$.pipe(
        map((checklists) => ({checklists, loaded: true}))
      ),
      // error$ reducer
      this.error$.pipe(map((error) => ({error})))
    );

    connect(this.state)
      .with(nextState$)
      // add$ reducer (checklistAdded$)
      .with(this.checklistAdded$, (state, checklist) => ({
        checklists: [...state.checklists, checklist]
      }))
      // edit$ reducer (checklistEdited$)
      .with(this.checklistEdited$, (state, updated) => ({
        checklists: state.checklists.map((checklist) =>
          checklist.id === updated.id
            ? updated
            : checklist
        )
      }))
      // remove$ reducer (checklistRemoved$)
      .with(this.checklistRemoved$, (state, id) => ({
        checklists: state.checklists.filter((checklist) => checklist.id !== id)
      }));
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
