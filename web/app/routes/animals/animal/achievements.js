import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsAnimalAchievementsRoute extends Route {
  @service api;

  async model() {
    const animal = this.modelFor('animals.animal');
    const [achievements, candidates] = await Promise.all([
      this.api.listAnimalAchievements(animal.id),
      this.api.listAnimals({ per_page: 100, sort: 'name' }),
    ]);
    return { animal, achievements, candidates: candidates.data };
  }
}
