export class Character {
  public initiative: number = -1;
  dexterityRequired: boolean = false;
  constructor(public name: string, public hitPoint: number, public isPlayer: boolean) {
  }

  setInitiative(initiative: number) {
    this.initiative = initiative;
  }
}
