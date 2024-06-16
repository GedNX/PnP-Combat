import {Injectable, OnInit} from "@angular/core";
import {Character} from "../model/character.model";

@Injectable()
export class CharacterService {
  private defaultCharacters: Character[] = [
    new Character('Lesan', 0, true),
    new Character('Reiniar', 0, true),
    new Character('Rogar', 0, true),
    new Character('Strike', 0, true),
    new Character('Torfin', 0, true)
    // new Character('Grimmbart', 0, true)
  ]
  characters: Character[] = []

  constructor() {
    this.defaultCharacters.forEach(c => this.characters.push(c));
  }

  sortByInitiative() {
    let compareFn = (a: Character, b: Character) => {
      if (a.initiative === b.initiative) {
        return a.priority > b.priority ? -1 : 1;
      }
      return a.initiative > b.initiative ? -1 : 1;
    };
    this.characters.sort(compareFn);
  }

  addCharacter(character: Character) {
    this.characters.push(character);
  }

  reset() {
    this.characters.splice(0, this.characters.length)
    this.defaultCharacters.forEach(c => this.characters.push(c));
  }
}
