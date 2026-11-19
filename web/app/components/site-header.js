import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class SiteHeaderComponent extends Component {
  @service router;
  @tracked open = false;

  get current() {
    return this.router.currentURL || '/';
  }

  get isAnimals() {
    return this.current.startsWith('/animals');
  }

  get isOwners() {
    return this.current.startsWith('/owners');
  }

  get isAchievements() {
    return this.current.startsWith('/achievements');
  }

  get isPlanner() {
    return this.current.startsWith('/mating-planner');
  }

  get isDashboard() {
    return this.current === '/' || this.current.startsWith('/dashboard');
  }

  @action
  toggle() {
    this.open = !this.open;
  }

  @action
  close() {
    this.open = false;
  }
}
