import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { CATEGORIES } from 'web/utils/enums';

export default class AnimalsAnimalAchievementsController extends Controller {
  @service api;
  @service flash;
  @service router;

  categories = Object.entries(CATEGORIES).map(([value, m]) => ({ value, ...m }));

  @tracked showForm = false;
  @tracked saving = false;
  @tracked errors = [];

  @tracked category = 'REKLA_RACE';
  @tracked event_name = '';
  @tracked location = '';
  @tracked event_date = '';
  @tracked rank_or_metric = '';
  @tracked partner = null;
  @tracked notes = '';

  @tracked confirmId = null;

  get animal() {
    return this.model.animal;
  }

  get grouped() {
    const out = new Map();
    for (const ach of this.model.achievements) {
      if (!out.has(ach.category)) out.set(ach.category, []);
      out.get(ach.category).push(ach);
    }
    return [...out.entries()].map(([category, items]) => ({
      category,
      label: CATEGORIES[category] || { en: category, ta: '', icon: '🏅' },
      items,
    }));
  }

  @action
  set(key, event) {
    const t = event?.target;
    this[key] = t ? (t.type === 'checkbox' ? t.checked : t.value) : event;
  }

  @action
  pickPartner(animal) {
    this.partner = animal;
  }

  @action
  toggleForm() {
    this.showForm = !this.showForm;
    this.errors = [];
  }

  @action
  async save(event) {
    event.preventDefault();
    if (!this.event_name.trim() || !this.rank_or_metric.trim()) {
      this.errors = ['Event name and rank / metric are both required.'];
      return;
    }
    this.saving = true;
    this.errors = [];
    try {
      await this.api.addAchievement(this.animal.id, {
        category: this.category,
        event_name: this.event_name.trim(),
        location: this.location.trim() || null,
        event_date: this.event_date || null,
        rank_or_metric: this.rank_or_metric.trim(),
        partner_animal_id: this.partner ? this.partner.id : null,
        notes: this.notes.trim() || null,
      });
      this.flash.success('Achievement logged.');
      this.showForm = false;
      this.event_name = '';
      this.rank_or_metric = '';
      this.location = '';
      this.event_date = '';
      this.notes = '';
      this.partner = null;
      this.router.refresh('animals.animal');
    } catch (e) {
      this.errors = e.list || [e.message];
    } finally {
      this.saving = false;
    }
  }

  @action
  askDelete(id) {
    this.confirmId = this.confirmId === id ? null : id;
  }

  @action
  async remove(id) {
    try {
      await this.api.deleteAchievement(this.animal.id, id);
      this.flash.success('Achievement removed.');
      this.confirmId = null;
      this.router.refresh('animals.animal');
    } catch (e) {
      this.flash.error(e.message);
    }
  }
}
