import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { COLORS_LIST, BIRTH_COLORS, DOB_PRECISION, DENTITION, DISTRICTS } from 'web/utils/enums';

const COLORS = COLORS_LIST;
const BIRTHS = Object.entries(BIRTH_COLORS).map(([value, m]) => ({ value, ...m }));
const PRECISIONS = Object.entries(DOB_PRECISION).map(([value, m]) => ({ value, ...m }));
const TEETH = Object.entries(DENTITION).map(([value, m]) => ({ value, ...m }));

export default class AnimalsNewController extends Controller {
  @service api;
  @service flash;
  @service router;

  colors = COLORS;
  birthColors = BIRTHS;
  precisions = PRECISIONS;
  dentitions = TEETH;
  districts = DISTRICTS;

  @tracked step = 1;
  @tracked saving = false;
  @tracked errors = [];
  @tracked submitted = null; // set when the record was accepted for review

  @tracked sex = 'BULL';
  @tracked name_ta = '';
  @tracked name_en = '';
  @tracked tag_or_reg_no = '';

  @tracked dob = '';
  @tracked dob_precision = 'EXACT';
  @tracked dentition_stage = '';
  @tracked birth_color = '';
  @tracked current_color = 'MAYILAI';
  @tracked distinctive_markings = '';
  @tracked current_village = '';
  @tracked current_district = 'Tiruppur';

  @tracked sire = null;
  @tracked dam = null;
  @tracked ownerMode = 'existing';
  @tracked owner_id = '';
  @tracked owner = { name_en: '', name_ta: '', phone: '', village: '', district: '', is_contact_public: false };

  @tracked stubFor = null;
  @tracked stubNameEn = '';
  @tracked stubNameTa = '';
  @tracked stubVillage = '';
  @tracked creatingStub = false;

  get isCalf() {
    return this.step === 1;
  }

  get summaryName() {
    return this.name_en || 'New animal';
  }

  @action
  set(key, event) {
    const target = event?.target;
    this[key] = target ? (target.type === 'checkbox' ? target.checked : target.value) : event;
    if (key === 'dob') {
      if (!this.dob) this.dob_precision = 'ESTIMATED_BY_TEETH';
      else if (/^\d{4}$/.test(this.dob)) this.dob_precision = 'YEAR_ONLY';
    }
  }

  @action
  setOwner(key, event) {
    this.owner = { ...this.owner, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value };
  }

  @action
  pickSex(value) {
    this.sex = value;
    if (value === 'COW') this.dam = null;
    if (value === 'BULL') this.sire = null;
  }

  @action
  next() {
    if (this.step === 1 && !this.validateStep1()) return;
    this.step = Math.min(3, this.step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @action
  back() {
    this.step = Math.max(1, this.step - 1);
  }

  @action
  goto(step) {
    this.step = step;
  }

  validateStep1() {
    const errs = [];
    if (!this.name_ta.trim()) errs.push('Tamil name (name_ta) is required — e.g. வேல்');
    if (!this.name_en.trim()) errs.push('English name (name_en) is required — e.g. Vel');
    this.errors = errs;
    return errs.length === 0;
  }

  buildPayload() {
    const payload = {
      name_ta: this.name_ta.trim(),
      name_en: this.name_en.trim(),
      sex: this.sex,
      current_color: this.current_color,
      dob_precision: this.dob_precision,
    };
    if (this.tag_or_reg_no.trim()) payload.tag_or_reg_no = this.tag_or_reg_no.trim();
    if (this.dob) payload.dob = this.dob;
    if (this.dentition_stage) payload.dentition_stage = this.dentition_stage;
    if (this.birth_color) payload.birth_color = this.birth_color;
    if (this.distinctive_markings.trim()) payload.distinctive_markings = this.distinctive_markings.trim();
    if (this.current_village.trim()) payload.current_village = this.current_village.trim();
    if (this.current_district) payload.current_district = this.current_district;
    if (this.sex === 'BULL' && this.sire) payload.sire_id = this.sire.id;
    if (this.sex === 'BULL' && this.dam) payload.dam_id = this.dam.id;
    if (this.sex === 'COW') {
      if (this.sire) payload.sire_id = this.sire.id;
      if (this.dam) payload.dam_id = this.dam.id;
    }
    if (this.ownerMode === 'existing' && this.owner_id) payload.owner_id = Number(this.owner_id);
    if (this.ownerMode === 'new' && this.owner.name_en.trim()) {
      payload.owner = {
        name_en: this.owner.name_en.trim(),
        name_ta: this.owner.name_ta.trim() || null,
        phone: this.owner.phone.trim() || null,
        village: this.owner.village.trim() || null,
        district: this.owner.district || null,
        is_contact_public: !!this.owner.is_contact_public,
      };
      payload.owner_role = 'CURRENT_OWNER';
    }
    return payload;
  }

  @action
  async save(event) {
    event?.preventDefault?.();
    if (!this.validateStep1()) {
      this.step = 1;
      return;
    }
    this.saving = true;
    this.errors = [];
    try {
      const { data: animal, meta } = await this.api.createAnimal(this.buildPayload());
      if (meta?.review_status === 'PENDING') {
        this.submitted = {
          name_en: animal.name_en,
          name_ta: animal.name_ta,
          id: animal.id,
          message: meta.message,
        };
        this.flash.success('Submitted for review.');
        return;
      }
      this.flash.success(`${animal.name_en} (${animal.name_ta}) registered at Generation ${animal.documented_generations}.`);
      this.router.transitionTo('animals.animal', animal.id);
    } catch (e) {
      this.errors = e.list || [e.message];
      this.step = 1;
    } finally {
      this.saving = false;
    }
  }

  @action
  startAnother() {
    this.submitted = null;
    this.errors = [];
    this.step = 1;
    this.name_en = '';
    this.name_ta = '';
    this.tag_or_reg_no = '';
    this.distinctive_markings = '';
    this.sire = null;
    this.dam = null;
    this.owner_id = '';
  }

  @action
  assign(key, animal) {
    this[key] = animal;
  }

  @action
  openStub(kind) {
    this.stubFor = kind;
    this.stubNameEn = '';
    this.stubNameTa = '';
    this.stubVillage = this.current_village;
  }

  @action
  cancelStub() {
    this.stubFor = null;
  }

  @action
  async createStub() {
    if (!this.stubName_en()) {
      this.errors = ['A stub ancestor needs at least an English name.'];
      return;
    }
    this.creatingStub = true;
    try {
      const { data: animal, meta } = await this.api.createAnimal({
        name_ta: this.stubNameTa.trim() || this.stubNameEn.trim(),
        name_en: this.stubNameEn.trim(),
        sex: this.stubFor === 'sire' ? 'BULL' : 'COW',
        current_color: 'OTHER',
        current_village: this.stubVillage.trim() || null,
        current_district: this.current_district || null,
        is_stub: true,
      });
      if (meta?.review_status === 'PENDING') {
        this.errors = ['Stub ancestors are created by registry administrators only.'];
        return;
      }
      if (this.stubFor === 'sire') this.sire = animal;
      else this.dam = animal;
      this.flash.success(`Stub ancestor “${animal.name_en}” created — it can be completed later.`);
      this.stubFor = null;
    } catch (e) {
      this.errors = e.list || [e.message];
    } finally {
      this.creatingStub = false;
    }
  }

  stubName_en() {
    return this.stubNameEn.trim();
  }
}
