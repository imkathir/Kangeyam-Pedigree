import Controller from '@ember/controller';
import { action, set } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class OwnersIndexController extends Controller {
  queryParams = ['q', 'district'];
  @tracked q = '';
  @tracked district = '';

  timer = null;

  get districts() {
    const out = new Set();
    (this.model?.data || []).forEach((o) => {
      if (o.district) out.add(o.district);
    });
    return [...out].sort();
  }

  @action
  onSearch(event) {
    const value = event.target.value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      set(this, 'q', value);
    }, 260);
  }

  @action
  setDistrict(event) {
    set(this, 'district', event.target.value);
  }
}
