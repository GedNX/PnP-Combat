import { Injectable } from '@angular/core';

@Injectable()
export class CombatService {
  private readonly combatStorageKey = 'pnp-combat-active';
  private onCombat = typeof localStorage !== 'undefined' && localStorage.getItem(this.combatStorageKey) === 'true';

  isOnCombat(): boolean {
    return this.onCombat;
  }

  startCombat(): void {
    this.onCombat = true;
    this.persistState();
  }

  finishCombat(): void {
    this.onCombat = false;
    this.persistState();
  }

  private persistState() {
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.combatStorageKey, String(this.onCombat));
  }
}
