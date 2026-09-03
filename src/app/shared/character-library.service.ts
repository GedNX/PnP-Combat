import { Injectable } from '@angular/core';
import { Character, MonsterTemplate, PlayerTemplate } from '../model/character.model';
import { CharacterStorageService } from './character-storage.service';

export type LibraryImportMode = 'add' | 'overwrite' | 'replace';

@Injectable({ providedIn: 'root' })
export class CharacterLibraryService {
  readonly savedMonsters: MonsterTemplate[];
  readonly savedPlayers: PlayerTemplate[];

  constructor(private readonly storage: CharacterStorageService) {
    this.savedMonsters = storage.loadMonsters();
    this.savedPlayers = storage.loadPlayers();
  }

  createMonster(name: string): Character | null {
    const monster = this.savedMonsters.find((saved) => saved.name === name);
    return monster ? new Character(monster.name, monster.maxHitPoint, false) : null;
  }

  createPlayer(name: string): Character | null {
    const player = this.savedPlayers.find((saved) => saved.name === name);
    return player ? new Character(player.name, player.maxHitPoint, true) : null;
  }

  save(character: Character): void {
    if (character.isPlayer) this.savePlayer(character);
    else if (character.maxHitPoint !== null) this.saveMonster(character);
  }

  export(): string {
    const players = this.savedPlayers.map((player) => player.maxHitPoint === null
      ? { name: player.name }
      : { name: player.name, maxHitPoint: player.maxHitPoint });
    return JSON.stringify({ version: 1, monsters: this.savedMonsters, players }, null, 2);
  }

  import(json: string, mode: LibraryImportMode): boolean {
    const data = this.parse(json);
    if (!data) return false;

    if (mode === 'replace') {
      this.savedMonsters.splice(0, this.savedMonsters.length, ...data.monsters);
      this.savedPlayers.splice(0, this.savedPlayers.length, ...data.players);
    } else {
      this.merge(this.savedMonsters, data.monsters, mode);
      this.merge(this.savedPlayers, data.players, mode);
    }

    this.storage.saveMonsters(this.savedMonsters);
    this.storage.savePlayers(this.savedPlayers);
    return true;
  }

  private saveMonster(character: Character): void {
    const existing = this.savedMonsters.find((monster) => monster.name.toLowerCase() === character.name.toLowerCase());
    if (existing) existing.maxHitPoint = character.maxHitPoint as number;
    else this.savedMonsters.push({ name: character.name, maxHitPoint: character.maxHitPoint as number });
    this.storage.saveMonsters(this.savedMonsters);
  }

  private savePlayer(character: Character): void {
    const existing = this.savedPlayers.find((player) => player.name.toLowerCase() === character.name.toLowerCase());
    if (existing) existing.maxHitPoint = character.maxHitPoint;
    else this.savedPlayers.push({ name: character.name, maxHitPoint: character.maxHitPoint });
    this.storage.savePlayers(this.savedPlayers);
  }

  private parse(json: string): { monsters: MonsterTemplate[]; players: PlayerTemplate[] } | null {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed?.monsters) || !Array.isArray(parsed?.players)) return null;

      const monsters = parsed.monsters.filter(this.isMonsterTemplate);
      const players = parsed.players.filter(this.isPlayerTemplate);
      if (monsters.length !== parsed.monsters.length || players.length !== parsed.players.length) return null;

      return {
        monsters,
        players: players.map((player: PlayerTemplate) => ({ ...player, maxHitPoint: player.maxHitPoint ?? null })),
      };
    } catch {
      return null;
    }
  }

  private merge<T extends { name: string }>(current: T[], incoming: T[], mode: LibraryImportMode): void {
    incoming.forEach((item) => {
      const index = current.findIndex((entry) => entry.name.toLowerCase() === item.name.toLowerCase());
      if (index < 0) current.push(item);
      else if (mode === 'overwrite') current[index] = item;
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
      (player.maxHitPoint === undefined || player.maxHitPoint === null || (Number.isFinite(player.maxHitPoint) && player.maxHitPoint >= 0));
  }
}
