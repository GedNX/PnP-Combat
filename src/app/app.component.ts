import { Component } from '@angular/core';
import { DeckComponent } from "./deck/deck.component";

@Component({
  selector: 'app-root',
  imports: [DeckComponent],
  template: `<app-deck/>`
})
export class AppComponent {}
