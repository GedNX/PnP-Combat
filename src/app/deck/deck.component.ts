import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
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
  LucideExternalLink,
  LucideRotateCwSquare,
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
    LucideExternalLink,
    LucideRotateCwSquare,
    LucideSword,
    LucideUpload,
    LucideUserRound,
  ],
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckComponent implements OnDestroy {
  protected characterService = inject(CharacterService);
  protected combatService = inject(CombatService);
  protected characters = signal<Character[]>([]);
  protected revision = signal(0);
  protected onFight = signal(this.combatService.isOnCombat());
  protected displayMode = signal(
    typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('display'),
  );
  protected displayRotation = signal<0 | 90 | 180 | 270>(0);
  protected savedMonsters = signal(this.characterService.savedMonsters);
  protected savedPlayers = signal(this.characterService.savedPlayers);

  private readonly storageListener = () => {
    setTimeout(() => {
      this.characterService.reloadCurrentState();
      this.onFight.set(this.combatService.isOnCombat());
      this.refresh(false);
    });
  };

  constructor() {
    this.refresh(!this.displayMode());
    if (this.displayMode())
      window.addEventListener('storage', this.storageListener);
  }
  ngOnDestroy() {
    if (this.displayMode())
      window.removeEventListener('storage', this.storageListener);
  }
  protected refresh(persist = true) {
    this.characters.set([...this.characterService.characters]);
    if (persist) this.characterService.persistCurrentState();
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
  protected librarySearch = signal('');
  protected librarySort = signal<'name' | 'hitPoints'>('name');
  protected librarySortDirections = signal<
    Record<'name' | 'hitPoints', 'asc' | 'desc'>
  >({
    name: 'asc',
    hitPoints: 'asc',
  });
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
    this.librarySearch.set('');
  }
  protected toggleLibraryPanel() {
    this.libraryExpanded.update((expanded) => !expanded);
  }
  protected closeLibrary() {
    this.libraryOpen.set(false);
    this.librarySearch.set('');
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
  protected filteredSavedMonsters() {
    const search = this.librarySearch().trim().toLowerCase();
    return this.savedMonsters()
      .filter((monster) => monster.name.toLowerCase().includes(search))
      .sort((a, b) =>
        this.compareLibraryEntries(
          a.name,
          a.maxHitPoint,
          b.name,
          b.maxHitPoint,
        ),
      );
  }
  protected filteredSavedPlayers() {
    const search = this.librarySearch().trim().toLowerCase();
    return this.availableSavedPlayers()
      .filter((player) => player.name.toLowerCase().includes(search))
      .sort((a, b) =>
        this.compareLibraryEntries(
          a.name,
          a.maxHitPoint,
          b.name,
          b.maxHitPoint,
        ),
      );
  }
  protected setLibrarySort(sort: 'name' | 'hitPoints') {
    if (this.librarySort() === sort) {
      this.librarySortDirections.update((directions) => ({
        ...directions,
        [sort]: directions[sort] === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      this.librarySort.set(sort);
    }
  }
  protected librarySortDirection(sort: 'name' | 'hitPoints') {
    return this.librarySortDirections()[sort];
  }
  private compareLibraryEntries(
    nameA: string,
    hitPointsA: number | null,
    nameB: string,
    hitPointsB: number | null,
  ) {
    let result: number;
    if (this.librarySort() === 'hitPoints') {
      if (hitPointsA === null)
        result = hitPointsB === null ? this.compareNames(nameA, nameB) : 1;
      else if (hitPointsB === null) result = -1;
      else
        result =
          hitPointsA !== hitPointsB
            ? hitPointsA - hitPointsB
            : this.compareNames(nameA, nameB);
    } else {
      result = this.compareNames(nameA, nameB);
    }
    return this.librarySortDirections()[this.librarySort()] === 'asc'
      ? result
      : -result;
  }
  private compareNames(nameA: string, nameB: string) {
    return nameA.localeCompare(nameB, 'de', { sensitivity: 'base' });
  }
  protected displayCharacters() {
    const characters = this.characters();
    if (this.onFight()) return characters;
    return characters
      .filter((character) => character.isPlayer === true)
      .sort((a, b) => this.compareNames(a.name, b.name));
  }
  protected preparationPlayers() {
    return this.characters()
      .filter((character) => character.isPlayer)
      .sort((a, b) => this.compareNames(a.name, b.name));
  }
  protected preparationMonsters() {
    return this.characters().filter((character) => !character.isPlayer);
  }
  protected monsterNumber(character: Character) {
    if (character.isPlayer) return null;
    return character.monsterNumber;
  }
  protected openDisplayWindow() {
    if (typeof window === 'undefined') return;
    window.open(
      `${window.location.href.split('?')[0]}?display=1`,
      'pnp-combat-display',
      'popup,width=420,height=720',
    );
  }

  protected rotateDisplay() {
    this.displayRotation.update((rotation) => ((rotation + 90) % 360) as 0 | 90 | 180 | 270);
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
