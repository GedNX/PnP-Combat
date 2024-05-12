import {Component, Input} from '@angular/core';
import {Character} from "../../model/character.model";
import {CharacterService} from "../../shared/character.service";
import {CombatService} from "../../shared/combat.service";

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})

export class CardComponent {
  @Input() character!: Character;
  private characterService: CharacterService;
  private combatService: CombatService;

  constructor(characterService: CharacterService, combatService: CombatService) {
    this.characterService = characterService;
    this.combatService = combatService;
  }

  setInitiative(initiative: number) {
    this.character.priorityRequired = false;

    this.characterService.characters.filter(c => c.initiative === initiative).forEach(c => {
        c.priorityRequired = true;
        this.character.priorityRequired = true;
    });
    this.character.setInitiative(initiative);
  }

  setPriority(priority: number) {
    this.character.setPriority(priority);
  }

  isOnCombat(): boolean {
    return this.combatService.isOnCombat();
  }

  protected readonly parseInt = parseInt;

  damage(value: string) {
    this.character.hitPoint -= parseInt(value)
  }

  removeCharacter() {
    let indexOf = this.characterService.characters.indexOf(this.character);
    this.characterService.characters.splice(indexOf, 1)
  }
}
