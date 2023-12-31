export class Character {
  public initiative: number = -1;
  public priority: number = -1;
  priorityRequired: boolean = false;
  constructor(public name: string, public hitPoint: number, public isPlayer: boolean) {
  }

  setInitiative(initiative: number) {
    this.initiative = initiative;
  }

  setPriority(priority: number) {
    this.priority = priority;
  }
}
