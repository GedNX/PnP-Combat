import {ChangeDetectionStrategy, Component, inject, input,} from '@angular/core';
import {Character} from '../../model/character.model';
import {CharacterService} from '../../shared/character.service';
import {CombatService} from '../../shared/combat.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  character = input.required<Character>();
  protected characterService = inject(CharacterService);
  protected combatService = inject(CombatService);

  setInitiative(initiative: number) {
    this.character().setPriorityRequired(false);

    this.characterService.characters
      .filter((c) => c.initiative === initiative)
      .forEach((c) => {
        c.priorityRequired = true;
        this.character().setPriorityRequired(true);
      });
    this.character().setInitiative(initiative);
  }

  setPriority(priority: number) {
    this.character().setPriority(priority);
  }

  isOnCombat(): boolean {
    return this.combatService.isOnCombat();
  }

  protected readonly parseInt = parseInt;

  damage(value: string) {
    this.character().hitPoint -= parseInt(value);
  }

  removeCharacter() {
    let indexOf = this.characterService.characters.indexOf(this.character());
    this.characterService.characters.splice(indexOf, 1);
  }
}
