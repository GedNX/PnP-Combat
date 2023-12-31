import {Injectable} from "@angular/core";

@Injectable()
export class CombatService {
  private onCombat: boolean = false;

  isOnCombat(): boolean {
    return this.onCombat
  }

  startCombat(): void {
    this.onCombat = true;
  }

  finishCombat(): void {
    this.onCombat = false;
  }
}
