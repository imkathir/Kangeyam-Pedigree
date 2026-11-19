import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsAnimalEditRoute extends Route {
  @service api;

  async model() {
    const animal = this.modelFor('animals.animal');
    const owners = await this.api.listOwners({ per_page: 100 });
    return { animal, owners: owners.data };
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.load(model.animal);
  }
}
