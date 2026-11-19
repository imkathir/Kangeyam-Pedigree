import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsAnimalOwnershipRoute extends Route {
  @service api;

  async model() {
    const animal = this.modelFor('animals.animal');
    const [ownerships, owners] = await Promise.all([
      this.api.listOwnerships(animal.id),
      this.api.listOwners({ per_page: 100 }),
    ]);
    return { animal, ownerships, owners: owners.data };
  }
}
