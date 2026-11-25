import Controller from '@ember/controller';
import { action, set } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class AnimalsAnimalPedigreeController extends Controller {
  queryParams = ['depth'];
  @tracked depth = 4;
  depths = [2, 3, 4, 5];

  @action
  setDepth(value) {
    set(this, 'depth', value);
  }
}
