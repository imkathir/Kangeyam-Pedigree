import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { DISTRICTS } from 'web/utils/enums';

export default class OwnersNewController extends Controller {
  @service api;
  @service flash;
  @service router;

  districts = DISTRICTS;
  @tracked saving = false;
  @tracked errors = [];
  @tracked submitted = null;

  @tracked name_en = '';
  @tracked name_ta = '';
  @tracked farm_name = '';
  @tracked phone = '';
  @tracked village = '';
  @tracked district = 'Tiruppur';
  @tracked is_contact_public = false;
  @tracked notes = '';

  @action
  set(key, event) {
    const t = event?.target;
    this[key] = t ? (t.type === 'checkbox' ? t.checked : t.value) : event;
  }

  @action
  async save(event) {
    event.preventDefault();
    if (!this.name_en.trim()) {
      this.errors = ['The owner needs an English name.'];
      return;
    }
    this.saving = true;
    this.errors = [];
    try {
      const { data: owner, meta } = await this.api.createOwner({
        name_en: this.name_en.trim(),
        name_ta: this.name_ta.trim() || null,
        farm_name: this.farm_name.trim() || null,
        phone: this.phone.trim() || null,
        village: this.village.trim() || null,
        district: this.district || null,
        is_contact_public: this.is_contact_public,
        notes: this.notes.trim() || null,
      });
      if (meta?.review_status === 'PENDING') {
        this.submitted = { name_en: owner.name_en, name_ta: owner.name_ta, id: owner.id, message: meta.message };
        this.flash.success('Submitted for review.');
        return;
      }
      this.flash.success(`${owner.name_en} added to the breeders directory.`);
      this.router.transitionTo('owners.owner', owner.id);
    } catch (e) {
      this.errors = e.list || [e.message];
    } finally {
      this.saving = false;
    }
  }

  @action
  startAnother() {
    this.submitted = null;
    this.errors = [];
    this.name_en = '';
    this.name_ta = '';
    this.farm_name = '';
    this.phone = '';
    this.village = '';
    this.notes = '';
  }
}
