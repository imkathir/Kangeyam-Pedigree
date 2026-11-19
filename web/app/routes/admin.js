import Route from '@ember/routing/route';
import { service } from '@ember/service';

/**
 * Review queue. Deliberately not linked from the navigation: it is reached by
 * typing /admin, and only works in a browser that holds the registry key.
 */
export default class AdminRoute extends Route {
  @service api;

  async model() {
    if (!this.api.hasWriteKey) return { locked: true };
    try {
      const payload = await this.api.getReviewQueue();
      return { locked: false, queue: payload.data, counts: payload.meta?.counts, writes: payload.meta?.writes };
    } catch (error) {
      return { locked: true, error: error.list ? error.list.join(' · ') : error.message };
    }
  }
}
