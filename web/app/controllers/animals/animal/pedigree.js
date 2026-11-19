import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class AnimalsAnimalPedigreeController extends Controller {
  queryParams = ['depth'];
  depth = 4;
  depths = [2, 3, 4, 5];

  @action
  setDepth(value) {
    this.depth = value;
  }
}
