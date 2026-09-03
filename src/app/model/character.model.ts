export interface MonsterTemplate {
  name: string;
  maxHitPoint: number;
}

export interface PlayerTemplate {
  name: string;
  maxHitPoint: number | null;
}

export class Character {
  public initiative: number = -1;
  public currentHitPoint: number | null;
  public status = '';

  constructor(
    public name: string,
    public maxHitPoint: number | null,
    public isPlayer: boolean,
    public dexterityModifier: number | null = null,
  ) { this.currentHitPoint = maxHitPoint; }

  get hitPoint(): number | null { return this.currentHitPoint; }
  set hitPoint(value: number | null) { this.currentHitPoint = value === null ? null : Math.max(0, value); }

  setInitiative(initiative: number) {
    this.initiative = initiative;
  }

  takeDamage(amount: number) {
    if (this.currentHitPoint !== null) this.currentHitPoint = Math.max(0, this.currentHitPoint - Math.max(0, amount));
  }

  heal(amount: number) {
    if (this.currentHitPoint !== null && this.maxHitPoint !== null) this.currentHitPoint = Math.min(this.maxHitPoint, this.currentHitPoint + Math.max(0, amount));
  }
}
