import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsAnimalRoute extends Route {
  @service api;

  async model(params) {
    return this.api.getAnimal(params.animal_id);
  }
}
