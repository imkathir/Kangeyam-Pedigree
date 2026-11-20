import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { COLORS_LIST, BIRTH_COLORS, DOB_PRECISION, DENTITION, DISTRICTS } from 'web/utils/enums';
import { compressImage, isImageFile } from 'web/utils/compress-image';

const COLORS = COLORS_LIST;
const BIRTHS = Object.entries(BIRTH_COLORS).map(([value, m]) => ({ value, ...m }));
const PRECISIONS = Object.entries(DOB_PRECISION).map(([value, m]) => ({ value, ...m }));
const TEETH = Object.entries(DENTITION).map(([value, m]) => ({ value, ...m }));

function readPlainDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

export default class AnimalsNewController extends Controller {
  @service api;
  @service flash;
  @service router;

  colors = COLORS;
  birthColors = BIRTHS;
  precisions = PRECISIONS;
  dentitions = TEETH;
  districts = DISTRICTS;

  @tracked saving = false;
  @tracked errors = [];
  @tracked submitted = null; // set when the record was accepted for review

  @tracked sex = 'BULL';
  @tracked name = '';
  @tracked photos = []; // [{ media_url: dataURL }] — attached to the record on save

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
  @tracked owner = { name: '', phone: '', village: '', district: '', is_contact_public: false };

  @tracked stubFor = null;
  @tracked stubName = '';
  @tracked stubVillage = '';
  @tracked creatingStub = false;

  get summaryName() {
    return this.name || 'New animal';
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

  /** Attach photos while registering — the owner usually has them at hand. */
  @action
  async addPhotos(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = ''; // allow re-picking the same file later
    for (const file of files) {
      if (this.photos.length >= 10) {
        this.flash.error('A maximum of 10 photos per animal.');
        break;
      }
      try {
        const media_url = isImageFile(file)
          ? await compressImage(file, { maxDim: 1600, maxBytes: 400000 })
          : await readPlainDataURL(file);
        // keep the whole JSON body well under the 4.5 MB request cap
        if (this.photos.reduce((n, p) => n + p.media_url.length, 0) + media_url.length > 4_200_000) {
          this.flash.error('Total photo size is too large — remove a few and try again.');
          break;
        }
        this.photos = [...this.photos, { media_url, media_type: 'PHOTO' }];
      } catch (e) {
        this.flash.error(e.message || 'That file could not be read.');
      }
    }
  }

  @action
  removePhoto(index) {
    this.photos = this.photos.filter((_, i) => i !== index);
  }

  @action
  pickSex(value) {
    this.sex = value;
    if (value === 'COW') this.dam = null;
    if (value === 'BULL') this.sire = null;
  }

  validateName() {
    const errs = [];
    if (!this.name.trim()) errs.push('A name is required — type it in Tamil or English.');
    this.errors = errs;
    return errs.length === 0;
  }

  buildPayload() {
    const payload = {
      name: this.name.trim(),
      sex: this.sex,
      current_color: this.current_color,
      dob_precision: this.dob_precision,
    };
    if (this.photos.length) payload.media = this.photos;
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
    if (this.ownerMode === 'new' && this.owner.name.trim()) {
      payload.owner = {
        name: this.owner.name.trim(),
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
    if (!this.validateName()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      this.flash.success(`${animal.name_en} registered at Generation ${animal.documented_generations}.`);
      this.router.transitionTo('animals.animal', animal.id);
    } catch (e) {
      this.errors = e.list || [e.message];
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      this.saving = false;
    }
  }

  @action
  startAnother() {
    this.submitted = null;
    this.errors = [];
    this.name = '';
    this.photos = [];
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
    this.stubName = '';
    this.stubVillage = this.current_village;
  }

  @action
  cancelStub() {
    this.stubFor = null;
  }

  @action
  async createStub() {
    if (!this.stubName.trim()) {
      this.errors = ['A stub ancestor needs a name — Tamil or English.'];
      return;
    }
    this.creatingStub = true;
    try {
      const { data: animal, meta } = await this.api.createAnimal({
        name: this.stubName.trim(),
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

}
