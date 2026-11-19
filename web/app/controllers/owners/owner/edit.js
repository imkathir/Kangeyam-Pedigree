import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { DISTRICTS } from 'web/utils/enums';

export default class OwnersOwnerEditController extends Controller {
  @service api;
  @service flash;
  @service router;

  districts = DISTRICTS;
  @tracked saving = false;
  @tracked errors = [];

  @tracked name_en;
  @tracked name_ta;
  @tracked farm_name;
  @tracked phone;
  @tracked village;
  @tracked district;
  @tracked is_contact_public;
  @tracked notes;

  load(o) {
    if (!o) return;
    this.name_en = o.name_en;
    this.name_ta = o.name_ta || '';
    this.farm_name = o.farm_name || '';
    this.phone = o.phone || '';
    this.village = o.village || '';
    this.district = o.district || '';
    this.is_contact_public = o.is_contact_public;
    this.notes = o.notes || '';
  }

  get owner() {
    return this.model.owner;
  }

  @action
  set(key, event) {
    const t = event?.target;
    this[key] = t ? (t.type === 'checkbox' ? t.checked : t.value) : event;
  }

  @action
  async save(event) {
    event.preventDefault();
    this.saving = true;
    this.errors = [];
    try {
      await this.api.updateOwner(this.owner.id, {
        name_en: this.name_en.trim(),
        name_ta: this.name_ta.trim() || null,
        farm_name: this.farm_name.trim() || null,
        phone: this.phone.trim() || null,
        village: this.village.trim() || null,
        district: this.district || null,
        is_contact_public: this.is_contact_public,
        notes: this.notes.trim() || null,
      });
      this.flash.success('Owner profile updated.');
      this.router.transitionTo('owners.owner', this.owner.id);
    } catch (e) {
      this.errors = e.list || [e.message];
    } finally {
      this.saving = false;
    }
  }
}
