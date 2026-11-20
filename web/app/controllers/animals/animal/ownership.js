import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { ROLES } from 'web/utils/enums';

export default class AnimalsAnimalOwnershipController extends Controller {
  @service api;
  @service flash;
  @service router;

  roles = Object.entries(ROLES).map(([value, m]) => ({ value, ...m }));

  @tracked showForm = false;
  @tracked saving = false;
  @tracked busyId = null;
  @tracked errors = [];

  @tracked role = 'CURRENT_OWNER';
  @tracked owner_id = '';
  @tracked ownerMode = 'existing';
  @tracked newOwner = { name: '', farm_name: '', phone: '', village: '', district: '', is_contact_public: false };
  @tracked from_date = '';
  @tracked to_date = '';
  @tracked place_note = '';
  @tracked sequence_order = '';

  @tracked editingId = null;
  @tracked draft = {};
  @tracked confirmId = null;

  get animal() {
    return this.model.animal;
  }

  @action
  set(key, event) {
    const t = event?.target;
    this[key] = t ? (t.type === 'checkbox' ? t.checked : t.value) : event;
  }

  @action
  setNewOwner(key, event) {
    this.newOwner = { ...this.newOwner, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value };
  }

  @action
  toggleForm() {
    this.showForm = !this.showForm;
    this.errors = [];
  }

  @action
  async save(event) {
    event.preventDefault();
    const payload = {
      role: this.role,
      from_date: this.from_date || null,
      to_date: this.to_date || null,
      place_note: this.place_note.trim() || null,
    };
    if (this.sequence_order) payload.sequence_order = Number(this.sequence_order);

    if (this.ownerMode === 'existing') {
      if (!this.owner_id) {
        this.errors = ['Choose an owner, or switch to “Add a new owner”.'];
        return;
      }
      payload.owner_id = Number(this.owner_id);
    } else {
      if (!this.newOwner.name.trim()) {
        this.errors = ['The new owner needs a name — type it in Tamil or English.'];
        return;
      }
      payload.owner = { ...this.newOwner, name: this.newOwner.name.trim() };
    }

    this.saving = true;
    this.errors = [];
    try {
      await this.api.addOwnership(this.animal.id, payload);
      this.flash.success('Ownership history updated.');
      this.showForm = false;
      this.owner_id = '';
      this.from_date = '';
      this.to_date = '';
      this.place_note = '';
      this.sequence_order = '';
      this.newOwner = { name: '', farm_name: '', phone: '', village: '', district: '', is_contact_public: false };
      this.router.refresh('animals.animal');
    } catch (e) {
      this.errors = e.list || [e.message];
    } finally {
      this.saving = false;
    }
  }

  @action
  edit(row) {
    this.editingId = row.id;
    this.confirmId = null;
    this.draft = {
      from_date: row.from_date || '',
      to_date: row.to_date || '',
      place_note: row.place_note || '',
      sequence_order: row.sequence_order,
      role: row.role,
    };
  }

  @action
  setDraft(key, event) {
    this.draft = { ...this.draft, [key]: event.target.value };
  }

  @action
  async saveEdit(id) {
    if (this.busyId) return;
    this.busyId = id;
    try {
      await this.api.updateOwnership(this.animal.id, id, {
        from_date: this.draft.from_date || null,
        to_date: this.draft.to_date || null,
        place_note: this.draft.place_note || null,
        sequence_order: Number(this.draft.sequence_order) || 1,
        role: this.draft.role,
      });
      this.flash.success('Ownership entry updated.');
      this.editingId = null;
      this.router.refresh('animals.animal');
    } catch (e) {
      this.flash.error(e.message);
    } finally {
      this.busyId = null;
    }
  }

  @action
  cancelEdit() {
    this.editingId = null;
  }

  @action
  askDelete(id) {
    this.confirmId = this.confirmId === id ? null : id;
    this.editingId = null;
  }

  @action
  async remove(id) {
    if (this.busyId) return;
    this.busyId = id;
    try {
      await this.api.deleteOwnership(this.animal.id, id);
      this.flash.success('Ownership entry removed.');
      this.confirmId = null;
      this.router.refresh('animals.animal');
    } catch (e) {
      this.flash.error(e.message);
    } finally {
      this.busyId = null;
    }
  }
}
