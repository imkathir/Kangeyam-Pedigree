import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { LIFE_STAGE } from 'web/utils/enums';

const SAMPLES = [
  '/media/bull-portrait.jpg',
  '/media/bull-herd.jpg',
  '/media/cow-portrait.jpg',
  '/media/cow-grazing.jpg',
  '/media/calf.jpg',
  '/media/rekla.jpg',
  '/media/jallikattu.jpg',
  '/media/show.jpg',
  '/media/farm.jpg',
];

export default class AnimalsAnimalGalleryController extends Controller {
  @service api;
  @service flash;
  @service router;

  stages = Object.entries(LIFE_STAGE).map(([value, m]) => ({ value, ...m }));
  samples = SAMPLES;

  @tracked filter = '';
  @tracked showForm = false;
  @tracked saving = false;
  @tracked errors = [];

  @tracked media_url = '';
  @tracked caption = '';
  @tracked life_stage = 'ADULT';
  @tracked is_primary = false;
  @tracked media_type = 'PHOTO';

  get animal() {
    return this.model.animal;
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
  useSample(url) {
    this.media_url = url;
    this.showForm = true;
  }

  @action
  async uploadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      this.flash.error('Please choose an image under 3.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.media_url = String(reader.result);
      this.showForm = true;
      this.flash.success('Image loaded — add a caption and save.');
    };
    reader.readAsDataURL(file);
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
      this.errors = ['Provide an image URL, upload a photo, or pick a sample.'];
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
    try {
      await this.api.updateMedia(this.animal.id, media.id, { is_primary: true });
      this.flash.success('Primary profile image updated.');
      this.router.refresh('animals.animal');
    } catch (e) {
      this.flash.error(e.message);
    }
  }

  @action
  async remove(media) {
    try {
      await this.api.deleteMedia(this.animal.id, media.id);
      this.flash.success('Photo removed.');
      this.router.refresh('animals.animal');
    } catch (e) {
      this.flash.error(e.message);
    }
  }
}
