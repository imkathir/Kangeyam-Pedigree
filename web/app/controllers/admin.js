import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class AdminController extends Controller {
  @service api;
  @service router;
  @service flash;

  @tracked busyId = null;
  @tracked busyKind = null;
  @tracked notice = null;
  @tracked error = null;

  get queue() {
    return this.model?.queue || { animals: [], owners: [] };
  }

  get counts() {
    return this.model?.counts || {};
  }

  get locked() {
    return this.model?.locked !== false;
  }

  get empty() {
    return this.queue.animals.length === 0 && this.queue.owners.length === 0;
  }

  async refresh() {
    try {
      const payload = await this.api.getReviewQueue();
      this.model = { locked: false, queue: payload.data, counts: payload.meta?.counts };
    } catch (e) {
      this.error = e.list ? e.list.join(' · ') : e.message;
    }
  }

  @action
  async review(kind, id, action) {
    this.busyKind = kind;
    this.busyId = id;
    this.error = null;
    this.notice = null;
    try {
      const payload = kind === 'animal'
        ? await this.api.reviewAnimal(id, action)
        : await this.api.reviewOwner(id, action);
      this.notice = payload.meta?.message || `Record #${id} → ${payload.data.review_status}.`;
      await this.refresh();
    } catch (e) {
      this.error = e.list ? e.list.join(' · ') : e.message;
    } finally {
      this.busyKind = null;
      this.busyId = null;
    }
  }

  @action
  approveAnimal(animal) {
    return this.review('animal', animal.id, 'approve');
  }

  @action
  rejectAnimal(animal) {
    return this.review('animal', animal.id, 'reject');
  }

  @action
  approveOwner(owner) {
    return this.review('owner', owner.id, 'approve');
  }

  @action
  rejectOwner(owner) {
    return this.review('owner', owner.id, 'reject');
  }

  @action
  reload() {
    this.router.refresh('admin');
  }
}
