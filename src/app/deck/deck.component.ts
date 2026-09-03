import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Character } from '../model/character.model';
import { CharacterService } from '../shared/character.service';
import { CombatService } from '../shared/combat.service';
import { CardComponent } from './card/card.component';

@Component({
  selector: 'app-deck',
  imports: [CardComponent],
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

  constructor() { this.refresh(); }
  protected refresh() {
    this.characters.set([...this.characterService.characters]);
    this.characterService.persistPreparation();
    this.revision.update((value) => value + 1);
    this.savedMonsters.set([...this.characterService.savedMonsters]);
    this.savedPlayers.set([...this.characterService.savedPlayers]);
  }
  protected canStartFight() {
    return this.characters().length > 0 && this.characters().every((character) =>
      character.initiative >= 0 && (character.isPlayer || character.maxHitPoint !== null) && (!this.hasInitiativeTie(character) || character.dexterityModifier !== null),
    );
  }
  protected hasInitiativeTie(character: Character) {
    return character.initiative >= 0 && this.characters().some((other) =>
      other !== character && other.initiative === character.initiative,
    );
  }

  createCharacter(name: string, hitPointValue: string, isPlayer: boolean) {
    if (!name.trim()) return;
    const hitPoint = Number(hitPointValue);
    const maximumHitPoints = hitPointValue.trim() === '' ? null : (Number.isFinite(hitPoint) && hitPoint >= 0 ? hitPoint : null);
    if (!isPlayer && maximumHitPoints === null) return;
    this.characterService.addCharacter(new Character(name.trim(), maximumHitPoints, isPlayer));
    this.refresh();
  }

  protected addSavedMonster(name: string) {
    const monster = this.characterService.addSavedMonster(name);
    if (monster) { this.characterService.addCharacter(monster); this.refresh(); }
  }
  protected addSavedPlayer(name: string) {
    const player = this.characterService.addSavedPlayer(name);
    if (player) { this.characterService.addCharacter(player); this.refresh(); }
  }
  protected libraryOpen = signal(false);
  protected participantType = signal<'monster' | 'player'>('monster');
  protected typeOpen = signal(false);
  protected toggleType() { this.typeOpen.update((open) => !open); }
  protected chooseType(type: 'monster' | 'player') { this.participantType.set(type); this.typeOpen.set(false); }
  protected toggleLibrary() { this.libraryOpen.update((open) => !open); }
  protected closeLibrary() { this.libraryOpen.set(false); }
  protected chooseSavedParticipant(type: string, name: string) {
    if (type === 'monster') this.addSavedMonster(name);
    else this.addSavedPlayer(name);
    this.closeLibrary();
  }
  protected availableSavedPlayers() {
    return this.savedPlayers().filter((saved) => !this.characters().some((character) => character.isPlayer && character.name.toLowerCase() === saved.name.toLowerCase()));
  }

  protected readonly Number = Number;
  fight() {
    if (!this.canStartFight()) return;
    this.combatService.startCombat();
    this.characterService.sortByInitiative();
    this.refresh();
    this.onFight.set(true);
  }

  fightEnd() {
    this.combatService.finishCombat();
    this.refresh();
    this.onFight.set(false);
  }
}
