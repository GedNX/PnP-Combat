import { Injectable } from '@angular/core';
import { Character, MonsterTemplate, PlayerTemplate } from '../model/character.model';

export type LibraryImportMode = 'add' | 'overwrite' | 'replace';

@Injectable()
export class CharacterService {
  private readonly monsterStorageKey = 'pnp-combat-monsters';
  private readonly preparationStorageKey = 'pnp-combat-preparation';
  private readonly playerStorageKey = 'pnp-combat-players';
  characters: Character[] = [];
  savedMonsters: MonsterTemplate[] = [];
  savedPlayers: PlayerTemplate[] = [];

  constructor() {
    this.loadSavedMonsters();
    this.loadSavedPlayers();
    this.loadPreparation();
  }

  sortByInitiative() {
    let compareFn = (a: Character, b: Character) => {
      if (a.initiative === b.initiative) {
        return (b.dexterityModifier ?? 0) - (a.dexterityModifier ?? 0);
      }
        return b.initiative - a.initiative;
    };
    this.characters.sort(compareFn);
  }

  addCharacter(character: Character) {
    this.characters.push(character);
    if (!character.isPlayer && character.maxHitPoint !== null) this.saveMonster(character);
    if (character.isPlayer) this.savePlayer(character);
    this.persistPreparation();
  }

  addSavedMonster(name: string) {
    const monster = this.savedMonsters.find((saved) => saved.name === name);
    return monster ? new Character(monster.name, monster.maxHitPoint, false) : null;
  }

  addSavedPlayer(name: string) {
    if (this.characters.some((character) => character.isPlayer && character.name.toLowerCase() === name.toLowerCase())) return null;
    const player = this.savedPlayers.find((saved) => saved.name === name);
    return player ? new Character(player.name, player.maxHitPoint, true) : null;
  }

  exportLibrary() {
    const players = this.savedPlayers.map((player) => player.maxHitPoint === null
      ? { name: player.name }
      : { name: player.name, maxHitPoint: player.maxHitPoint });
    return JSON.stringify({ version: 1, monsters: this.savedMonsters, players }, null, 2);
  }

  importLibrary(json: string, mode: LibraryImportMode) {
    let data: { monsters: MonsterTemplate[]; players: PlayerTemplate[] };
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed?.monsters) || !Array.isArray(parsed?.players)) return false;
      const monsters = parsed.monsters.filter((monster: MonsterTemplate) => typeof monster?.name === 'string' && monster.name.trim() && Number.isFinite(monster.maxHitPoint) && monster.maxHitPoint >= 0);
      const players = parsed.players.filter((player: PlayerTemplate) => typeof player?.name === 'string' && player.name.trim() && (player.maxHitPoint === undefined || player.maxHitPoint === null || (Number.isFinite(player.maxHitPoint) && player.maxHitPoint >= 0)));
      if (monsters.length !== parsed.monsters.length || players.length !== parsed.players.length) return false;
      data = { monsters, players: players.map((player: PlayerTemplate) => ({ ...player, maxHitPoint: player.maxHitPoint ?? null })) };
    } catch { return false; }
    if (mode === 'replace') { this.savedMonsters = data.monsters; this.savedPlayers = data.players; }
    else {
      const merge = <T extends { name: string }>(current: T[], incoming: T[]) => {
        incoming.forEach((item) => { const index = current.findIndex((entry) => entry.name.toLowerCase() === item.name.toLowerCase()); if (index < 0) current.push(item); else if (mode === 'overwrite') current[index] = item; });
      };
      merge(this.savedMonsters, data.monsters); merge(this.savedPlayers, data.players);
    }
    this.persistSavedMonsters(); this.persistSavedPlayers();
    return true;
  }

  private saveMonster(character: Character) {
    const existing = this.savedMonsters.find((monster) => monster.name.toLowerCase() === character.name.toLowerCase());
    if (existing) existing.maxHitPoint = character.maxHitPoint as number;
    else this.savedMonsters.push({ name: character.name, maxHitPoint: character.maxHitPoint as number });
    this.persistSavedMonsters();
  }

  private loadSavedMonsters() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem(this.monsterStorageKey) ?? '[]');
      if (Array.isArray(stored)) this.savedMonsters = stored.filter((monster): monster is MonsterTemplate =>
        typeof monster?.name === 'string' && monster.name.trim().length > 0 && Number.isFinite(monster.maxHitPoint) && monster.maxHitPoint >= 0,
      );
    } catch { this.savedMonsters = []; }
  }

  private persistSavedMonsters() {
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.monsterStorageKey, JSON.stringify(this.savedMonsters));
  }

  private savePlayer(character: Character) {
    const existing = this.savedPlayers.find((player) => player.name.toLowerCase() === character.name.toLowerCase());
    if (existing) existing.maxHitPoint = character.maxHitPoint;
    else this.savedPlayers.push({ name: character.name, maxHitPoint: character.maxHitPoint });
    this.persistSavedPlayers();
  }

  private loadSavedPlayers() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem(this.playerStorageKey) ?? '[]');
      if (Array.isArray(stored)) this.savedPlayers = stored.filter((player): player is PlayerTemplate =>
        typeof player?.name === 'string' && player.name.trim().length > 0 &&
        (player.maxHitPoint === null || (Number.isFinite(player.maxHitPoint) && player.maxHitPoint >= 0)),
      );
    } catch { this.savedPlayers = []; }
  }

  private persistSavedPlayers() {
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.playerStorageKey, JSON.stringify(this.savedPlayers));
  }

  persistPreparation() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.preparationStorageKey, JSON.stringify(this.characters));
  }

  private loadPreparation() {
    if (typeof localStorage === 'undefined') return false;
    try {
      const stored = JSON.parse(localStorage.getItem(this.preparationStorageKey) ?? 'null');
      if (!Array.isArray(stored) || stored.length === 0) return false;
      const loaded = stored.filter((item) =>
        typeof item?.name === 'string' && item.name.trim().length > 0 &&
        typeof item.isPlayer === 'boolean' &&
        (item.maxHitPoint === null || (Number.isFinite(item.maxHitPoint) && item.maxHitPoint >= 0)),
      );
      if (loaded.length !== stored.length) return false;
      this.characters = loaded.map((item) => {
        const character = new Character(item.name, item.maxHitPoint, item.isPlayer, item.dexterityModifier ?? null);
        character.initiative = typeof item.initiative === 'number' ? item.initiative : -1;
        character.status = typeof item.status === 'string' ? item.status : '';
        character.hitPoint = item.currentHitPoint ?? item.maxHitPoint;
        return character;
      });
      return true;
    } catch { return false; }
  }
}
