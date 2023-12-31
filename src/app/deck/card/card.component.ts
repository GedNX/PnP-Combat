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

    this.characterService.characters.forEach(c => {
      if (c.initiative === initiative) {
        c.priorityRequired = true;
        this.character.priorityRequired = true;
      }
    });
    this.character.setInitiative(initiative);
  }


  isOnCombat(): boolean {
    return this.combatService.isOnCombat();
  }

  protected readonly parseInt = parseInt;

  damage($event: KeyboardEvent, value: string) {
    if ($event.key === 'Enter') {
      this.character.hitPoint -= parseInt(value)
    }
    console.log($event)
  }

  removeCharacter() {
    let indexOf = this.characterService.characters.indexOf(this.character);
    this.characterService.characters.splice(indexOf, 1)
  }
}
