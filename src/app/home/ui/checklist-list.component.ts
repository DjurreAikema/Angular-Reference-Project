import {Component, input} from '@angular/core';
import {Checklist} from '../../shared/interfaces';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-checklist-list',
  imports: [
    RouterLink
  ],
  template: `
    <ul>
      @for (checklist of checklists(); track checklist.id) {
        <a routerLink="/checklist/{{ checklist.id }}">
          {{ checklist.title }}
        </a>
      } @empty {
        <p>Click the add button to create your first checklist!</p>
      }
    </ul>
  `
})
export class ChecklistListComponent {
  checklists = input.required<Checklist[]>();
}
