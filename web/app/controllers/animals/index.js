import Controller from '@ember/controller';
import { action, set } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { COLORS_LIST } from 'web/utils/enums';

export default class AnimalsIndexController extends Controller {
  queryParams = ['q', 'sex', 'color', 'village', 'min_generations', 'has_achievements', 'sort', 'page'];

  @tracked q = '';
  @tracked sex = '';
  @tracked color = '';
  @tracked village = '';
  @tracked min_generations = '';
  @tracked has_achievements = false;
  @tracked sort = 'recent';
  @tracked page = 1;

  timer = null;

  get colors() {
    return COLORS_LIST;
  }

  get pageNumbers() {
    const total = this.model?.meta?.total_pages || 1;
    const current = this.model?.meta?.page || 1;
    const out = [];
    for (let p = Math.max(1, current - 2); p <= Math.min(total, current + 2); p += 1) out.push(p);
    return out;
  }

  get activeFilters() {
    const out = [];
    if (this.q) out.push({ key: 'q', label: `“${this.q}”` });
    if (this.sex) out.push({ key: 'sex', label: this.sex === 'BULL' ? 'Bulls only' : 'Cows only' });
    if (this.color) out.push({ key: 'color', label: this.color.replace(/_/g, ' ').toLowerCase() });
    if (this.village) out.push({ key: 'village', label: `village: ${this.village}` });
    if (this.min_generations) out.push({ key: 'min_generations', label: `≥ ${this.min_generations} generations` });
    if (this.has_achievements) out.push({ key: 'has_achievements', label: 'has achievements' });
    return out;
  }

  @action
  update(key, eventOrValue) {
    let value = eventOrValue;
    if (eventOrValue && eventOrValue.target) {
      value = eventOrValue.target.type === 'checkbox' ? eventOrValue.target.checked : eventOrValue.target.value;
    }
    set(this, key, value);
    set(this, 'page', 1);
  }

  @action
  onSearch(event) {
    const value = event.target.value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      set(this, 'q', value);
      set(this, 'page', 1);
    }, 260);
  }

  @action
  clearFilter(key) {
    set(this, key, key === 'has_achievements' ? false : '');
    set(this, 'page', 1);
  }

  @action
  clearAll() {
    set(this, 'q', '');
    set(this, 'sex', '');
    set(this, 'color', '');
    set(this, 'village', '');
    set(this, 'min_generations', '');
    set(this, 'has_achievements', false);
    set(this, 'page', 1);
  }

  @action
  toggleSex(value) {
    set(this, 'sex', this.sex === value ? '' : value);
    set(this, 'page', 1);
  }

  @action
  toggleAchievements() {
    set(this, 'has_achievements', !this.has_achievements);
    set(this, 'page', 1);
  }
}
