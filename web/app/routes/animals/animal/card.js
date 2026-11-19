import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsAnimalCardRoute extends Route {
  @service api;

  async model() {
    const animal = this.modelFor('animals.animal');
    const pedigree = await this.api.getPedigree(animal.id, 3);
    return { animal, pedigree };
  }
}
