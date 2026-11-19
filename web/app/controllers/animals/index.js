import Controller from '@ember/controller';
import { action } from '@ember/object';
import { COLORS_LIST } from 'web/utils/enums';

export default class AnimalsIndexController extends Controller {
  queryParams = ['q', 'sex', 'color', 'village', 'min_generations', 'has_achievements', 'sort', 'page'];

  q = '';
  sex = '';
  color = '';
  village = '';
  min_generations = '';
  has_achievements = false;
  sort = 'recent';
  page = 1;

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
    this[key] = value;
    this.page = 1;
  }

  @action
  onSearch(event) {
    const value = event.target.value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.q = value;
      this.page = 1;
    }, 260);
  }

  @action
  clearFilter(key) {
    this[key] = key === 'has_achievements' ? false : '';
    this.page = 1;
  }

  @action
  clearAll() {
    this.q = '';
    this.sex = '';
    this.color = '';
    this.village = '';
    this.min_generations = '';
    this.has_achievements = false;
    this.page = 1;
  }

  @action
  toggleSex(value) {
    this.sex = this.sex === value ? '' : value;
    this.page = 1;
  }

  @action
  toggleAchievements() {
    this.has_achievements = !this.has_achievements;
    this.page = 1;
  }
}
