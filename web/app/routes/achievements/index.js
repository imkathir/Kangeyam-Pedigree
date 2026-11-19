import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AchievementsIndexRoute extends Route {
  @service api;

  async model(params) {
    return this.api.listAchievements({
      q: params.q,
      category: params.category,
      page: params.page,
      per_page: 12,
    });
  }
}
