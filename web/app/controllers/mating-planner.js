import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class MatingPlannerController extends Controller {
  queryParams = ['sire', 'dam'];
  sire = '';
  dam = '';

  @action
  setSire(event) {
    this.sire = event.target.value;
  }

  @action
  setDam(event) {
    this.dam = event.target.value;
  }

  @action
  swap() {
    const s = this.sire;
    this.sire = this.dam;
    this.dam = s;
  }

  @action
  reset() {
    this.sire = '';
    this.dam = '';
  }
}
