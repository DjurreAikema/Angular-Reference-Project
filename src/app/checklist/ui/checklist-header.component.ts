import {Component, input} from '@angular/core';
import {Checklist} from '../../shared/interfaces';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-checklist-header',
  imports: [
    RouterLink
  ],
  template: `
    <header>
      <a routerLink="/home">Back</a>
      <h1>{{ checklist().title }}</h1>
    </header>
  `
})
export class ChecklistHeaderComponent {
  checklist = input.required<Checklist>();
}
