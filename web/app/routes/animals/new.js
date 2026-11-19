import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsNewRoute extends Route {
  @service api;

  async model() {
    const owners = await this.api.listOwners({ per_page: 100 });
    return { owners: owners.data };
  }
}
