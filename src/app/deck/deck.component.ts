import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Character } from '../model/character.model';
import { CharacterService } from '../shared/character.service';
import { CombatService } from '../shared/combat.service';
import { LibraryFormat, LibraryImportMode } from '../shared/character.service';
import { CardComponent } from './card/card.component';
import {
  LucideArrowRight,
  LucideChevronDown,
  LucideDownload,
  LucideSword,
  LucideUpload,
  LucideUserRound,
} from '@lucide/angular';

@Component({
  selector: 'app-deck',
  imports: [
    CardComponent,
    LucideArrowRight,
    LucideChevronDown,
    LucideDownload,
    LucideSword,
    LucideUpload,
    LucideUserRound,
  ],
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckComponent {
  protected characterService = inject(CharacterService);
  protected combatService = inject(CombatService);
  protected characters = signal<Character[]>([]);
  protected revision = signal(0);
  protected onFight = signal(this.combatService.isOnCombat());
  protected savedMonsters = signal(this.characterService.savedMonsters);
  protected savedPlayers = signal(this.characterService.savedPlayers);

  constructor() {
    this.refresh();
  }
  protected refresh() {
    this.characters.set([...this.characterService.characters]);
    this.characterService.persistCurrentState();
    this.revision.update((value) => value + 1);
    this.savedMonsters.set([...this.characterService.savedMonsters]);
    this.savedPlayers.set([...this.characterService.savedPlayers]);
  }
  protected canStartFight() {
    return (
      this.characters().length > 0 &&
      this.characters().every(
        (character) =>
          character.initiative >= 0 &&
          (character.isPlayer || character.maxHitPoint !== null) &&
          (!this.hasInitiativeTie(character) ||
            character.dexterityModifier !== null),
      )
    );
  }
  protected hasInitiativeTie(character: Character) {
    return (
      character.initiative >= 0 &&
      this.characters().some(
        (other) =>
          other !== character && other.initiative === character.initiative,
      )
    );
  }

  createCharacter(name: string, hitPointValue: string, isPlayer: boolean) {
    if (!name.trim()) return;
    if (isPlayer && this.characterService.hasPlayer(name)) {
      this.playerName.set(name);
      this.playerNameConflict.set(
        this.characterService.playerNameConflict(name),
      );
      return;
    }
    const hitPoint = Number(hitPointValue);
    const maximumHitPoints =
      hitPointValue.trim() === ''
        ? null
        : Number.isFinite(hitPoint) && hitPoint >= 0
          ? hitPoint
          : null;
    if (!isPlayer && maximumHitPoints === null) return;
    this.characterService.addCharacter(
      new Character(name.trim(), maximumHitPoints, isPlayer),
    );
    this.refresh();
  }

  protected addSavedMonster(name: string) {
    const monster = this.characterService.addSavedMonster(name);
    if (monster) {
      this.characterService.addCharacter(monster);
      this.refresh();
    }
  }
  protected addSavedPlayer(name: string) {
    const player = this.characterService.addSavedPlayer(name);
    if (player) {
      this.characterService.addCharacter(player);
      this.refresh();
    }
  }
  protected libraryOpen = signal(false);
  protected participantType = signal<'monster' | 'player'>('monster');
  protected playerNameConflict = signal<'participant' | 'library' | null>(null);
  private playerName = signal('');
  private maxHitPointInput = signal('');
  protected typeOpen = signal(false);
  protected importOpen = signal(false);
  protected exportOpen = signal(false);
  protected importJson = signal('');
  protected exportFormat = signal<LibraryFormat>('yaml');
  protected importError = signal(false);
  protected libraryExpanded = signal(false);
  protected toggleType() {
    this.typeOpen.update((open) => !open);
  }
  protected chooseType(type: 'monster' | 'player') {
    this.participantType.set(type);
    this.typeOpen.set(false);
    this.updatePlayerNameState();
  }
  protected updatePlayerNameState(name?: string) {
    if (name !== undefined) this.playerName.set(name);
    this.playerNameConflict.set(
      this.participantType() === 'player'
        ? this.characterService.playerNameConflict(this.playerName())
        : null,
    );
  }
  protected updateMaxHitPointState(value: string) {
    this.maxHitPointInput.set(value);
  }
  protected canAddCharacter() {
    const nameValid = this.playerName().trim().length > 0;
    if (!nameValid) return false;
    if (this.participantType() === 'player')
      return this.playerNameConflict() === null;
    const hitPoint = Number(this.maxHitPointInput());
    return (
      this.maxHitPointInput().trim().length > 0 &&
      Number.isFinite(hitPoint) &&
      hitPoint >= 0
    );
  }
  protected exportLibrary() {
    this.importJson.set(
      this.characterService.exportLibrary(this.exportFormat()),
    );
    this.exportOpen.set(true);
  }
  protected setExportFormat(format: LibraryFormat) {
    this.exportFormat.set(format);
    if (this.exportOpen())
      this.importJson.set(this.characterService.exportLibrary(format));
  }
  protected openImport() {
    this.importJson.set('');
    this.importError.set(false);
    this.importOpen.set(true);
  }
  protected confirmImport(mode: LibraryImportMode) {
    if (!this.characterService.importLibrary(this.importJson(), mode)) {
      this.importError.set(true);
      return;
    }
    this.importOpen.set(false);
    this.refresh();
  }
  protected toggleLibrary() {
    this.libraryOpen.update((open) => !open);
  }
  protected toggleLibraryPanel() {
    this.libraryExpanded.update((expanded) => !expanded);
  }
  protected closeLibrary() {
    this.libraryOpen.set(false);
  }
  protected chooseSavedParticipant(type: string, name: string) {
    if (type === 'monster') this.addSavedMonster(name);
    else this.addSavedPlayer(name);
    this.closeLibrary();
  }
  protected availableSavedPlayers() {
    return this.savedPlayers().filter(
      (saved) =>
        !this.characters().some(
          (character) =>
            character.isPlayer &&
            character.name.toLowerCase() === saved.name.toLowerCase(),
        ),
    );
  }

  protected readonly Number = Number;
  fight() {
    if (!this.canStartFight()) return;
    this.combatService.startCombat();
    this.characterService.sortByInitiative();
    this.characterService.beginCombat();
    this.refresh();
    this.onFight.set(true);
  }

  fightEnd() {
    this.combatService.finishCombat();
    this.characterService.finishCombat();
    this.refresh();
    this.onFight.set(false);
  }
}
