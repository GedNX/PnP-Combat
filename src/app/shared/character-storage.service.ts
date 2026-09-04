import { Injectable } from '@angular/core';
import { Character, MonsterTemplate, PlayerTemplate } from '../model/character.model';

@Injectable({ providedIn: 'root' })
export class CharacterStorageService {
  private readonly monsterStorageKey = 'pnp-combat-monsters';
  private readonly preparationStorageKey = 'pnp-combat-preparation';
  private readonly combatStorageKey = 'pnp-combat-session';
  private readonly combatActiveStorageKey = 'pnp-combat-active';
  private readonly playerStorageKey = 'pnp-combat-players';

  loadMonsters(): MonsterTemplate[] {
    const stored = this.read<unknown>(this.monsterStorageKey, []);
    return Array.isArray(stored) ? stored.filter(this.isMonsterTemplate) : [];
  }

  saveMonsters(monsters: MonsterTemplate[]): void {
    this.write(this.monsterStorageKey, monsters);
  }

  loadPlayers(): PlayerTemplate[] {
    const stored = this.read<unknown>(this.playerStorageKey, []);
    return Array.isArray(stored) ? stored.filter(this.isPlayerTemplate) : [];
  }

  savePlayers(players: PlayerTemplate[]): void {
    this.write(this.playerStorageKey, players);
  }

  loadCurrentCharacters(): Character[] {
    const combatCharacters = this.isCombatActive()
      ? this.loadCharacters(this.combatStorageKey)
      : null;
    return combatCharacters ?? this.loadCharacters(this.preparationStorageKey) ?? [];
  }

  savePreparation(characters: Character[]): void {
    this.write(this.preparationStorageKey, characters);
  }

  saveCombatSession(characters: Character[]): void {
    this.write(this.combatStorageKey, characters);
  }

  clearCombatSession(): void {
    if (this.hasStorage()) localStorage.removeItem(this.combatStorageKey);
  }

  isCombatActive(): boolean {
    return this.hasStorage() && localStorage.getItem(this.combatActiveStorageKey) === 'true';
  }

  private loadCharacters(storageKey: string): Character[] | null {
    const stored = this.read<unknown>(storageKey, null);
    if (!Array.isArray(stored) || stored.length === 0) return null;

    const valid = stored.every((item) =>
      typeof item?.name === 'string' && item.name.trim().length > 0 &&
      typeof item.isPlayer === 'boolean' &&
      (item.maxHitPoint === null || (Number.isFinite(item.maxHitPoint) && item.maxHitPoint >= 0)),
    );
    if (!valid) return null;

    const usedMonsterNumbers = new Set<number>();
    let nextMonsterNumber = 1;
    return stored.map((item) => {
      let monsterNumber = typeof item.monsterNumber === 'number' &&
        Number.isInteger(item.monsterNumber) && item.monsterNumber > 0
        ? item.monsterNumber
        : null;
      if (!item.isPlayer) {
        while (monsterNumber === null || usedMonsterNumbers.has(monsterNumber)) {
          monsterNumber = nextMonsterNumber++;
        }
        usedMonsterNumbers.add(monsterNumber);
        nextMonsterNumber = Math.max(nextMonsterNumber, monsterNumber + 1);
      } else {
        monsterNumber = null;
      }
      const character = new Character(item.name, item.maxHitPoint, item.isPlayer, item.dexterityModifier ?? null, monsterNumber);
      character.initiative = typeof item.initiative === 'number' ? item.initiative : -1;
      character.status = typeof item.status === 'string' ? item.status : '';
      character.hitPoint = item.currentHitPoint ?? item.maxHitPoint;
      return character;
    });
  }

  private isMonsterTemplate(value: unknown): value is MonsterTemplate {
    const monster = value as MonsterTemplate;
    return typeof monster?.name === 'string' && monster.name.trim().length > 0 &&
      Number.isFinite(monster.maxHitPoint) && monster.maxHitPoint >= 0;
  }

  private isPlayerTemplate(value: unknown): value is PlayerTemplate {
    const player = value as PlayerTemplate;
    return typeof player?.name === 'string' && player.name.trim().length > 0 &&
      (player.maxHitPoint === null || (Number.isFinite(player.maxHitPoint) && player.maxHitPoint >= 0));
  }

  private read<T>(key: string, fallback: T): T {
    if (!this.hasStorage()) return fallback;
    try {
      return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) as T;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown): void {
    if (this.hasStorage()) localStorage.setItem(key, JSON.stringify(value));
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
