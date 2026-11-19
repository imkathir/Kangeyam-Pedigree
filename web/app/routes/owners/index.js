import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class OwnersIndexRoute extends Route {
  @service api;

  async model(params) {
    return this.api.listOwners({ q: params.q, district: params.district, per_page: 30 });
  }
}
