import { Injectable } from '@angular/core';
import { Character } from '../model/character.model';
import { CharacterLibraryService, LibraryFormat, LibraryImportMode } from './character-library.service';
import { CharacterStorageService } from './character-storage.service';

export type { LibraryFormat, LibraryImportMode } from './character-library.service';

@Injectable()
export class CharacterService {
  characters: Character[] = [];

  constructor(
    private readonly storage: CharacterStorageService,
    private readonly library: CharacterLibraryService,
  ) {
    this.characters = storage.loadCurrentCharacters();
  }

  get savedMonsters() { return this.library.savedMonsters; }
  get savedPlayers() { return this.library.savedPlayers; }

  sortByInitiative(): void {
    this.characters.sort((a, b) => {
      if (a.initiative === b.initiative) {
        return (b.dexterityModifier ?? 0) - (a.dexterityModifier ?? 0);
      }
      return b.initiative - a.initiative;
    });
  }

  resetAfterCombat(): void {
    this.characters = this.characters
      .filter((character) => character.isPlayer)
      .map((player) => {
        player.setInitiative(-1);
        return player;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
  }

  beginCombat(): void {
    this.storage.saveCombatSession(this.characters);
    this.storage.savePreparation(this.characters.filter((character) => character.isPlayer));
  }

  finishCombat(): void {
    this.resetAfterCombat();
    this.storage.savePreparation(this.characters);
    this.storage.clearCombatSession();
  }

  persistCurrentState(): void {
    if (this.storage.isCombatActive()) this.storage.saveCombatSession(this.characters);
    else this.storage.savePreparation(this.characters);
  }

  reloadCurrentState(): void {
    this.characters = this.storage.loadCurrentCharacters();
  }

  addCharacter(character: Character): void {
    if (!character.isPlayer && character.monsterNumber === null)
      character.monsterNumber = this.nextMonsterNumber();
    this.characters.push(character);
    this.library.save(character);
    this.persistCurrentState();
  }

  addSavedMonster(name: string): Character | null { return this.library.createMonster(name); }

  addSavedPlayer(name: string): Character | null {
    if (this.characters.some((character) => character.isPlayer && character.name.toLowerCase() === name.toLowerCase())) return null;
    return this.library.createPlayer(name);
  }

  hasPlayer(name: string): boolean {
    return this.playerNameConflict(name) !== null;
  }

  playerNameConflict(name: string): 'participant' | 'library' | null {
    const normalizedName = name.trim().toLowerCase();
    if (this.characters.some((character) => character.isPlayer && character.name.trim().toLowerCase() === normalizedName)) return 'participant';
    if (this.savedPlayers.some((player) => player.name.trim().toLowerCase() === normalizedName)) return 'library';
    return null;
  }

  exportLibrary(format: LibraryFormat = 'yaml'): string { return this.library.export(format); }

  importLibrary(json: string, mode: LibraryImportMode): boolean {
    return this.library.import(json, mode);
  }

  private nextMonsterNumber(): number {
    const numbers = this.characters
      .filter((character) => !character.isPlayer && character.monsterNumber !== null)
      .map((character) => character.monsterNumber as number);
    return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  }
}
