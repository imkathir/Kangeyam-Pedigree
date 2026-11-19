import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class AnimalSearchComponent extends Component {
  @service api;

  @tracked query = '';
  @tracked results = [];
  @tracked open = false;
  @tracked searching = false;
  @tracked selected = null;

  timer = null;
  requestId = 0;

  constructor(owner, args) {
    super(owner, args);
    this.selected = args.selected || null;
    this.query = this.selected ? `${this.selected.name_en} (${this.selected.name_ta})` : '';
  }

  async fetchResults(term) {
    const id = ++this.requestId;
    this.searching = true;
    try {
      const payload = await this.api.listAnimals({
        q: term || undefined,
        sex: this.args.sex || undefined,
        per_page: 8,
        sort: 'name',
        exclude_id: undefined,
      });
      if (id === this.requestId) {
        this.results = payload.data.filter((a) => String(a.id) !== String(this.args.excludeId));
      }
    } catch {
      if (id === this.requestId) this.results = [];
    } finally {
      if (id === this.requestId) this.searching = false;
    }
  }

  @action
  onInput(event) {
    this.query = event.target.value;
    this.selected = null;
    this.open = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fetchResults(this.query), 230);
  }

  @action
  focus() {
    this.open = true;
    if (!this.results.length) this.fetchResults(this.query);
  }

  @action
  choose(animal) {
    this.selected = animal;
    this.query = `${animal.name_en} (${animal.name_ta})`;
    this.open = false;
    this.results = [];
    this.args.onSelect?.(animal);
  }

  @action
  clear() {
    this.selected = null;
    this.query = '';
    this.results = [];
    this.args.onSelect?.(null);
  }

  @action
  blurLater() {
    setTimeout(() => {
      this.open = false;
    }, 200);
  }
}
