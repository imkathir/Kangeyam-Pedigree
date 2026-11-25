import Controller from '@ember/controller';
import { action, set } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class AchievementsIndexController extends Controller {
  queryParams = ['q', 'category', 'page'];
  @tracked q = '';
  @tracked category = '';
  @tracked page = 1;

  timer = null;

  @action
  onSearch(event) {
    const value = event.target.value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      set(this, 'q', value);
      set(this, 'page', 1);
    }, 260);
  }
}
