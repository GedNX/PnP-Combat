import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
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
export class DeckComponent implements OnInit {
  protected characterService = inject(CharacterService);
  protected combatService = inject(CombatService);
  protected characters = signal<Character[]>([]);
  protected onFight = signal(false);

  ngOnInit() {
    this.characters.set(this.characterService.characters);
  }

  createCharacter(name: string, hitPoint: number, isPlayer: boolean) {
    console.info(name + ' :: ' + hitPoint + ' :: ' + isPlayer);
    this.characterService.addCharacter(new Character(name, hitPoint, isPlayer));
  }

  protected readonly Number = Number;
  protected readonly console = console;
  protected readonly Boolean = Boolean;

  setInitiative(initiativeElement: HTMLInputElement, index: number) {
    let initiative: number = parseInt(initiativeElement.value);
    //this.characterService.characters.at(index).setInitiative(initiative);
  }

  fight() {
    this.combatService.startCombat();
    this.characterService.sortByInitiative();
    this.onFight.set(true);
  }

  fightEnd() {
    this.combatService.finishCombat();
    this.characterService.reset();
    this.onFight.set(false);
  }
}
