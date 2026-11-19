import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class OwnersIndexController extends Controller {
  queryParams = ['q', 'district'];
  q = '';
  district = '';

  timer = null;

  @action
  onSearch(event) {
    const value = event.target.value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.q = value;
    }, 260);
  }

  @action
  setDistrict(event) {
    this.district = event.target.value;
  }
}
