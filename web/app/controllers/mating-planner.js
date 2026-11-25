import Controller from '@ember/controller';
import { action, set } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class MatingPlannerController extends Controller {
  queryParams = ['sire', 'dam'];
  @tracked sire = '';
  @tracked dam = '';

  @action
  setSire(event) {
    set(this, 'sire', event.target.value);
  }

  @action
  setDam(event) {
    set(this, 'dam', event.target.value);
  }

  @action
  swap() {
    const s = this.sire;
    set(this, 'sire', this.dam);
    set(this, 'dam', s);
  }

  @action
  reset() {
    set(this, 'sire', '');
    set(this, 'dam', '');
  }
}
