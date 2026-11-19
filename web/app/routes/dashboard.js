import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class DashboardRoute extends Route {
  @service api;

  async model() {
    const [stats, bulls, achievements, deepest, recent] = await Promise.all([
      this.api.getStats(),
      this.api.listAnimals({ sex: 'BULL', sort: 'achievements', per_page: 4 }),
      this.api.listAchievements({ per_page: 5 }),
      this.api.listAnimals({ sort: 'generations', min_generations: 2, per_page: 4 }),
      this.api.listAnimals({ sort: 'recent', per_page: 3 }),
    ]);
    return {
      stats,
      bulls: bulls.data,
      achievements: achievements.data,
      deepest: deepest.data,
      recent: recent.data,
    };
  }
}
