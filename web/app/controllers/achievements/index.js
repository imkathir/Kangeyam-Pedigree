import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class AchievementsIndexController extends Controller {
  queryParams = ['q', 'category', 'page'];
  q = '';
  category = '';
  page = 1;

  timer = null;

  @action
  onSearch(event) {
    const value = event.target.value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.q = value;
      this.page = 1;
    }, 260);
  }
}
