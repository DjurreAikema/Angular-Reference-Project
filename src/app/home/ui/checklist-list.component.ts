import {Component, input, output} from '@angular/core';
import {Checklist, RemoveChecklist} from '../../shared/interfaces';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-checklist-list',
  imports: [
    RouterLink
  ],
  template: `
    <ul>
      @for (checklist of checklists(); track checklist.id) {
        <li>
          <a routerLink="/checklist/{{ checklist.id }}">
            {{ checklist.title }}
          </a>

          <div>
            <button (click)="edit.emit(checklist)">Edit</button>
            <button (click)="remove.emit(checklist.id)">Delete</button>
          </div>
        </li>
      } @empty {
        <p>Click the add button to create your first checklist!</p>
      }
    </ul>
  `,
  styles: [
    `
      ul {
        padding: 0;
        margin: 0;
      }

      li {
        font-size: 1.5em;
        display: flex;
        justify-content: space-between;
        background: var(--color-light);
        list-style-type: none;
        margin-bottom: 1rem;
        padding: 1rem;

        button {
          margin-left: 1rem;
        }
      }
    `,
  ]
})
export class ChecklistListComponent {
  checklists = input.required<Checklist[]>();

  edit = output<Checklist>();
  remove = output<RemoveChecklist>();
}
