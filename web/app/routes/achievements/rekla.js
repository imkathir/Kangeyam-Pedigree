import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AchievementsReklaRoute extends Route {
  @service api;

  async model() {
    return this.api.listAchievements({ category: 'REKLA_RACE', per_page: 60 });
  }
}
