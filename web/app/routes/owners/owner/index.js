import Route from '@ember/routing/route';

export default class OwnersOwnerIndexRoute extends Route {
  model() {
    return this.modelFor('owners.owner');
  }
}
