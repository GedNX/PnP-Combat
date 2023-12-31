import {Component, OnInit} from '@angular/core';
import {Character} from "../model/character.model";
import {CharacterService} from "../shared/character.service";
import {CombatService} from "../shared/combat.service";

@Component({
  selector: 'app-deck',
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.scss']
})
export class DeckComponent implements OnInit {
  protected characters: Character[] = [];
  protected onFight: boolean = false;

  constructor(private characterService: CharacterService, private combatService: CombatService) {
  }

  ngOnInit() {
    this.characters = this.characterService.characters;
  }

  createCharacter(name: string, hitPoint: number, isPlayer: boolean) {
    console.info(name + " :: " + hitPoint + " :: " + isPlayer)
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
    this.onFight = true;
  }

  fightEnd() {
    this.combatService.finishCombat();
    this.characterService.reset();
    this.onFight = false;
  }
}
