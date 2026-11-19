import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AchievementsJallikattuRoute extends Route {
  @service api;

  async model() {
    return this.api.listAchievements({ category: 'JALLIKATTU', per_page: 60 });
  }
}
