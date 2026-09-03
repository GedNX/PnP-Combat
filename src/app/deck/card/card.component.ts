import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Character } from '../../model/character.model';
import { CharacterService } from '../../shared/character.service';
import { CombatService } from '../../shared/combat.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  character = input.required<Character>();
  revision = input.required<number>();
  changed = output<void>();
  protected confirmDelete = signal(false);
  protected characterService = inject(CharacterService);
  protected combatService = inject(CombatService);

  setInitiative(value: string) {
    const initiative = Number(value);
    if (Number.isFinite(initiative)) { this.character().setInitiative(initiative); this.changed.emit(); }
  }

  configureHitPoints(max: string) {
    const hp = Number(max);
    if (max.trim() === '' && this.character().isPlayer) {
      this.character().maxHitPoint = null;
      this.character().hitPoint = null;
      this.changed.emit();
    } else if (Number.isFinite(hp) && hp >= 0) {
      this.character().maxHitPoint = hp;
      this.character().hitPoint = hp;
      this.changed.emit();
    }
  }

  setDexterityModifier(value: string) {
    const modifier = Number(value);
    this.character().dexterityModifier = value.trim() === '' || !Number.isFinite(modifier) ? null : modifier;
    this.changed.emit();
  }

  needsDexterityModifier() {
    const initiative = this.character().initiative;
    return initiative >= 0 && this.characterService.characters.some((other) =>
      other !== this.character() && other.initiative === initiative,
    );
  }

  isOnCombat(): boolean {
    return this.combatService.isOnCombat();
  }

  damage(value: string) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
      this.character().takeDamage(amount);
      this.changed.emit();
    }
  }

  heal(value: string) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
      this.character().heal(amount);
      this.changed.emit();
    }
  }

  requestRemove() {
    if (this.character().isPlayer) this.confirmDelete.set(true);
    else this.removeCharacter();
  }

  cancelRemove() { this.confirmDelete.set(false); }

  removeCharacter() {
    let indexOf = this.characterService.characters.indexOf(this.character());
    if (indexOf >= 0) { this.characterService.characters.splice(indexOf, 1); this.confirmDelete.set(false); this.changed.emit(); }
  }
}
