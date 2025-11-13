import {computed, inject, Injectable, signal} from '@angular/core';
import {AddChecklist, Checklist, EditChecklist, RemoveChecklist} from '../interfaces';
import {catchError, EMPTY, map, merge, Observable, Subject, switchMap} from 'rxjs';
import {connect} from 'ngxtension/connect';
import {HttpClient} from '@angular/common/http';
import {ApiService} from './api.service';

export interface ChecklistsState {
  checklists: Checklist[];
  loaded: boolean;
  error: string | null;
}

interface ChecklistDto {
  id: string;
  title: string;
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

  private error$ = new Subject<string>();

  private checklistsLoaded$: Observable<Checklist[]> = this._http
    .get<ChecklistDto[]>(this._api.getUrl('/checklists'))
    .pipe(
      map(dtos => dtos.map(dto => ({
        id: dto.id, title: dto.title
      }))),
      catchError((err) => {
        this.error$.next(err.message || "Failed to load checklists");
        return EMPTY;
      })
    );

  private checklistAdded$: Observable<Checklist> = this.add$.pipe(
    switchMap(checklist =>
      this._http.post<ChecklistDto>(
        this._api.getUrl('/checklists'),
        {title: checklist.title}
      ).pipe(
        map(dto => ({
          id: dto.id, title: dto.title
        })),
        catchError(err => {
          this.error$.next(err.message || "Failed to add checklist");
          return EMPTY;
        })
      )
    )
  );

  private checklistEdited$: Observable<Checklist> = this.edit$.pipe(
    switchMap(update =>
      this._http.put<ChecklistDto>(
        this._api.getUrl(`/checklists/${update.id}`),
        {title: update.data.title}
      ).pipe(
        map(dto => ({
          id: dto.id, title: dto.title
        })),
        catchError(err => {
          this.error$.next(err.message || "Failed to edit checklist");
          return EMPTY;
        })
      )
    )
  );

  private checklistRemoved$: Observable<string> = this.remove$.pipe(
    switchMap(id =>
      this._http.delete(
        this._api.getUrl(`/checklists/${id}`)
      ).pipe(
        map(() => id),
        catchError(err => {
          this.error$.next(err.message || 'Failed to delete checklist');
          return EMPTY;
        })
      )
    )
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
