import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsIndexRoute extends Route {
  @service api;

  async model(params) {
    const payload = await this.api.listAnimals({
      q: params.q,
      sex: params.sex,
      color: params.color,
      village: params.village,
      min_generations: params.min_generations,
      has_achievements: params.has_achievements,
      sort: params.sort,
      page: params.page,
      per_page: 12,
    });
    return payload;
  }
}
