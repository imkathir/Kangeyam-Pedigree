import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class MatingPlannerRoute extends Route {
  @service api;

  queryParams = {
    sire: { refreshModel: true },
    dam: { refreshModel: true },
  };

  async model(params) {
    const [bulls, cows] = await Promise.all([
      this.api.listAnimals({ sex: 'BULL', per_page: 100, sort: 'name' }),
      this.api.listAnimals({ sex: 'COW', per_page: 100, sort: 'name' }),
    ]);

    let result = null;
    let error = null;
    if (params.sire && params.dam) {
      try {
        result = await this.api.checkCompatibility(Number(params.sire), Number(params.dam));
      } catch (e) {
        error = e.list ? e.list.join(' ') : e.message;
      }
    }

    return {
      bulls: bulls.data,
      cows: cows.data,
      result,
      error,
      sireId: params.sire || '',
      damId: params.dam || '',
    };
  }
}
