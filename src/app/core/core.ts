import { EnvironmentProviders, Provider } from "@angular/core";
import { provideRouter, Routes } from "@angular/router";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { CharacterService } from "../shared/character.service";
import { CombatService } from "../shared/combat.service";

export interface CoreOptions {
  routes: Routes;
}

export function provideCore(options: CoreOptions): (Provider | EnvironmentProviders)[] {
  return [
    provideAnimationsAsync(),
    provideRouter(options.routes),
    CharacterService,
    CombatService
    ];
}
