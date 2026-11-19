import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AchievementsShowsRoute extends Route {
  @service api;

  async model() {
    const [shows, dairy, progeny] = await Promise.all([
      this.api.listAchievements({ category: 'BREED_SHOW', per_page: 40 }),
      this.api.listAchievements({ category: 'DAIRY_LACTATION', per_page: 40 }),
      this.api.listAchievements({ category: 'PROGENY_MILESTONE', per_page: 40 }),
    ]);
    return { shows, dairy, progeny };
  }
}
