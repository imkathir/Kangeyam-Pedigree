import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class AnimalsAnimalCardController extends Controller {
  get animal() {
    return this.model.animal;
  }

  get grandparents() {
    const a = this.model.pedigree.ancestors;
    return {
      sireSire: a.sire ? a.sire.sire : null,
      sireDam: a.sire ? a.sire.dam : null,
      damSire: a.dam ? a.dam.sire : null,
      damDam: a.dam ? a.dam.dam : null,
    };
  }

  @action
  print() {
    window.print();
  }
}
