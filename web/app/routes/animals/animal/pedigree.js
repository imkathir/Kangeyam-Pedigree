import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsAnimalPedigreeRoute extends Route {
  @service api;

  queryParams = { depth: { refreshModel: true } };

  async model(params) {
    const animal = this.modelFor('animals.animal');
    const depth = Number(params.depth || 4);
    const pedigree = await this.api.getPedigree(animal.id, depth);
    return { animal, pedigree, depth };
  }
}
