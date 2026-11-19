import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class OwnersOwnerRoute extends Route {
  @service api;

  async model(params) {
    return this.api.getOwner(params.owner_id);
  }
}
