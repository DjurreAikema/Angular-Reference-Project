import {Component, contentChild, effect, inject, input, TemplateRef} from '@angular/core';
import {Dialog} from '@angular/cdk/dialog';

@Component({
  selector: 'app-modal',
  template: `
    <div></div>
  `
})
export class ModalComponent {
  dialog = inject(Dialog);

  isOpen = input.required<boolean>();
  template = contentChild.required(TemplateRef);

  // We can get a reference to a TemplateRef (this is what an <ng-template> is) that is supplied inside of the <app-modal> selector.
  // This means that the template class member we are setting up with contentChild here will be whatever template we supplied inside of <app-modal>:

  // <app-modal>
  //  <ng-template>
  //    You can't see me... yet!
  //   </ng-template>
  // </app-modal>

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();

      if (isOpen) {
        this.dialog.open(this.template(), {
          panelClass: 'dialog-container',
          hasBackdrop: false
        })
      } else {
        this.dialog.closeAll();
      }
    });
  }

  // That is the whole point of this wrapper component we have created. Rather than having to inject the Dialog wherever we want to use it
  // and imperatively calling this.dialog.open we just supply the template we want to use as above. We have also set up the isOpen input such
  // that we can just toggle that between true and false and it will automatically open and close the dialog for us.
}
