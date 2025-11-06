import {inject, Injectable, InjectionToken, PLATFORM_ID, resource} from '@angular/core';
import {Checklist, ChecklistItem} from '../interfaces';

export const LOCAL_STORAGE = new InjectionToken<Storage>(
  'window local storage object',
  {
    providedIn: 'root',
    factory: () => {
      return inject(PLATFORM_ID) === 'browser'
        ? window.localStorage
        : ({} as Storage);
    }
  }
);

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  storage = inject(LOCAL_STORAGE);

  // --- Checklists
  loadChecklists() {
    return resource({
      loader: () =>
        Promise.resolve(this.storage.getItem('checklists')).then(
          (checklists) => checklists ? (JSON.parse(checklists) as Checklist[]) : []
        )
    })
  }

  saveChecklists(checklists: Checklist[]) {
    this.storage.setItem('checklists', JSON.stringify(checklists));
  }

  // --- ChecklistItems
  loadChecklistItems() {
    return resource({
      loader: () =>
        Promise.resolve(this.storage.getItem('checklistItems')).then(
          (checklistItems) => checklistItems ? (JSON.parse(checklistItems) as ChecklistItem[]) : []
        )
    })
  }

  saveChecklistItems(checklistItems: ChecklistItem[]) {
    this.storage.setItem('checklistItems', JSON.stringify(checklistItems));
  }
}

// This is another one of those things where it looks like we are just complicating things.
// In order to interact with local storage, we want to use:
//   window.localStorage
//
// So… why all this other junk? Technically we don’t need this for our purposes, but we are creating a safer design for our Angular application.
//
// We are directly accessing a browser API here by using window — but an Angular application does not necessarily always run in the context of a browser,
// if you were using SSR (server side rendering) for example your Angular application would not have access to the window object.
//
// If you know your application will only ever run in the browser, and you want to just ignore all this stuff, you can do that if you like —
// you can just use window.localStorage directly. But this is still a useful technique in general.
//
// We might want to create a custom InjectionToken when we want something to change based on some kind of condition. For example,
// in this case we are changing what our injected LOCAL_STORAGE is (depending on the browser environment). In another circumstance,
// we might want to change what an injected dependency is based on whether the application is running a development or production version.
//
// Just like with a normal service, we can either provide it in root or we can manually provide it to wherever we want to use it.
//
// Then we have a factory function that determines what will actually be injected when we run inject(LOCAL_STORAGE). In this case,
// we check if we are running in the browser — in which case we will use window.localStorage. Otherwise, we can supply our alternate storage mechanism.
// We are not actually using an alternate storage mechanism here, we are just providing a fake object that will satisfy the Storage type.
