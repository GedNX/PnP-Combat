import {NgModule, isDevMode} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ServiceWorkerModule} from '@angular/service-worker';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DeckComponent} from './deck/deck.component';
import {CardComponent} from './deck/card/card.component';
import {CharacterService} from "./shared/character.service";
import {CombatService} from "./shared/combat.service";

@NgModule({
  declarations: [
    AppComponent,
    DeckComponent,
    CardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    // ServiceWorkerModule.register('ngsw-worker.js', {
    //   enabled: !isDevMode(),
    //   // Register the ServiceWorker as soon as the application is stable
    //   // or after 30 seconds (whichever comes first).
    //   registrationStrategy: 'registerWhenStable:30000'
    // }),
    BrowserAnimationsModule
  ],
  providers: [CharacterService, CombatService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
