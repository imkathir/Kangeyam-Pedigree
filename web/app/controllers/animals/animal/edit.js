import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { COLORS_LIST, BIRTH_COLORS, DOB_PRECISION, DENTITION, STATUS, DISTRICTS } from 'web/utils/enums';

export default class AnimalsAnimalEditController extends Controller {
  @service api;
  @service flash;
  @service i18n;
  @service router;

  colors = COLORS_LIST;
  birthColors = Object.entries(BIRTH_COLORS).map(([value, m]) => ({ value, ...m }));
  precisions = Object.entries(DOB_PRECISION).map(([value, m]) => ({ value, ...m }));
  dentitions = Object.entries(DENTITION).map(([value, m]) => ({ value, ...m }));
  statuses = Object.entries(STATUS).map(([value, m]) => ({ value, ...m }));
  districts = DISTRICTS;

  @tracked saving = false;
  @tracked errors = [];
  @tracked confirmDelete = false;
  @tracked archived = false;

  @tracked name_ta;
  @tracked name_en;
  @tracked tag_or_reg_no;
  @tracked sex;
  @tracked status;
  @tracked dob;
  @tracked dob_precision;
  @tracked dentition_stage;
  @tracked birth_color;
  @tracked current_color;
  @tracked distinctive_markings;
  @tracked current_village;
  @tracked current_district;
  @tracked notes;
  @tracked is_stub;
  @tracked sire;
  @tracked dam;

  load(a) {
    if (!a) return;
    this.name_ta = a.name_ta;
    this.name_en = a.name_en;
    this.tag_or_reg_no = a.tag_or_reg_no || '';
    this.sex = a.sex;
    this.status = a.status;
    this.dob = a.dob || '';
    this.dob_precision = a.dob_precision;
    this.dentition_stage = a.dentition_stage || '';
    this.birth_color = a.birth_color || '';
    this.current_color = a.current_color;
    this.distinctive_markings = a.distinctive_markings || '';
    this.current_village = a.current_village || '';
    this.current_district = a.current_district || '';
    this.notes = a.notes || '';
    this.is_stub = a.is_stub;
    this.sire = a.sire;
    this.dam = a.dam;
  }

  get animal() {
    return this.model.animal;
  }

  @action
  set(key, eventOrValue) {
    const t = eventOrValue?.target;
    this[key] = t ? (t.type === 'checkbox' ? t.checked : t.value) : eventOrValue;
  }

  @action
  assign(key, animal) {
    this[key] = animal;
  }

  @action
  async save(event) {
    event.preventDefault();
    this.saving = true;
    this.errors = [];
    try {
      await this.api.updateAnimal(this.animal.id, {
        name_ta: this.name_ta,
        name_en: this.name_en,
        tag_or_reg_no: this.tag_or_reg_no || null,
        sex: this.sex,
        status: this.status,
        dob: this.dob || null,
        dob_precision: this.dob_precision,
        dentition_stage: this.dentition_stage || null,
        birth_color: this.birth_color || null,
        current_color: this.current_color,
        distinctive_markings: this.distinctive_markings || null,
        current_village: this.current_village || null,
        current_district: this.current_district || null,
        notes: this.notes || null,
        is_stub: this.is_stub,
        sire_id: this.sire ? this.sire.id : null,
        dam_id: this.dam ? this.dam.id : null,
      });
      this.flash.success('Record updated.');
      this.router.transitionTo('animals.animal', this.animal.id);
    } catch (e) {
      this.errors = e.list || [e.message];
    } finally {
      this.saving = false;
    }
  }

  @action
  toggleDelete() {
    this.confirmDelete = !this.confirmDelete;
  }

  @action
  async destroy(force = false) {
    try {
      const res = await this.api.deleteAnimal(this.animal.id, force);
      if (res.data.archived) {
        this.flash.success(res.meta.message);
        this.router.transitionTo('animals');
      } else {
        this.flash.success('Animal deleted from the registry.');
        this.router.transitionTo('animals');
      }
    } catch (e) {
      this.flash.error(e.message);
    }
  }
}
