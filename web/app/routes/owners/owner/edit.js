import Route from '@ember/routing/route';

export default class OwnersOwnerEditRoute extends Route {
  model() {
    return { owner: this.modelFor('owners.owner') };
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.load(model.owner);
  }
}
