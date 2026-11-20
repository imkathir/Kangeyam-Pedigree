import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { LIFE_STAGE } from 'web/utils/enums';
import { compressImage, isImageFile } from 'web/utils/compress-image';

export default class AnimalsAnimalGalleryController extends Controller {
  @service api;
  @service flash;
  @service router;

  stages = Object.entries(LIFE_STAGE).map(([value, m]) => ({ value, ...m }));

  @tracked filter = '';
  @tracked showForm = false;
  @tracked saving = false;
  @tracked uploading = false;
  @tracked busyMediaId = null;
  @tracked errors = [];

  @tracked media_url = '';
  @tracked caption = '';
  @tracked life_stage = 'ADULT';
  @tracked is_primary = false;
  @tracked media_type = 'PHOTO';

  get animal() {
    return this.model.animal;
  }

  /** Keep in sync with MAX_MEDIA_PER_ANIMAL in server/src/lib.js. */
  get full() {
    return this.model.media.length >= 10;
  }

  get items() {
    if (!this.filter) return this.model.media;
    return this.model.media.filter((m) => m.life_stage === this.filter);
  }

  get counts() {
    const base = { ALL: this.model.media.length };
    for (const s of this.stages) {
      base[s.value] = this.model.media.filter((m) => m.life_stage === s.value).length;
    }
    return base;
  }

  @action
  set(key, event) {
    const t = event?.target;
    this[key] = t ? (t.type === 'checkbox' ? t.checked : t.value) : event;
  }

  @action
  setFilter(value) {
    this.filter = value;
  }

  @action
  async uploadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || this.uploading) return;
    this.uploading = true;
    try {
      if (isImageFile(file)) {
        // shrink first — uploads ride inside JSON and Vercel caps requests at 4.5 MB
        this.media_url = await compressImage(file, { maxDim: 1600, maxBytes: 50000 });
      } else {
        if (file.size > 3.5 * 1024 * 1024) {
          this.flash.error('Please choose an image under 3.5 MB.');
          return;
        }
        this.media_url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Could not read the file.'));
          reader.readAsDataURL(file);
        });
      }
      this.showForm = true;
      this.flash.success('Image loaded — add a caption and save.');
    } catch (e) {
      this.flash.error(e.message || 'That file could not be read.');
    } finally {
      this.uploading = false;
    }
  }

  @action
  toggleForm() {
    this.showForm = !this.showForm;
    this.errors = [];
  }

  @action
  async save(event) {
    event.preventDefault();
    if (!String(this.media_url).trim()) {
      this.errors = ['Choose a photo from this device.'];
      return;
    }
    this.saving = true;
    this.errors = [];
    try {
      await this.api.addMedia(this.animal.id, {
        media_url: this.media_url,
        media_type: this.media_type,
        life_stage: this.life_stage || null,
        caption: this.caption.trim() || null,
        is_primary: this.is_primary,
      });
      this.flash.success('Photo added to the gallery.');
      this.showForm = false;
      this.media_url = '';
      this.caption = '';
      this.is_primary = false;
      this.router.refresh('animals.animal');
    } catch (e) {
      this.errors = e.list || [e.message];
    } finally {
      this.saving = false;
    }
  }

  @action
  async makePrimary(media) {
    if (this.busyMediaId) return;
    this.busyMediaId = media.id;
    try {
      await this.api.updateMedia(this.animal.id, media.id, { is_primary: true });
      this.flash.success('Primary profile image updated.');
      this.router.refresh('animals.animal');
    } catch (e) {
      this.flash.error(e.message);
    } finally {
      this.busyMediaId = null;
    }
  }

  @action
  async remove(media) {
    if (this.busyMediaId) return;
    this.busyMediaId = media.id;
    try {
      await this.api.deleteMedia(this.animal.id, media.id);
      this.flash.success('Photo removed.');
      this.router.refresh('animals.animal');
    } catch (e) {
      this.flash.error(e.message);
    } finally {
      this.busyMediaId = null;
    }
  }
}
