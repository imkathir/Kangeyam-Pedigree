import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

/**
 * Compact control in the header: reads are public, writes need the registry key.
 * The key is kept in this browser's localStorage by the api service.
 */
export default class WriteKeyComponent extends Component {
  @service api;

  @tracked open = false;
  @tracked draft = '';
  @tracked note = '';

  get active() {
    return this.api.hasWriteKey;
  }

  @action
  toggle() {
    this.open = !this.open;
    this.draft = this.api.writeKey;
    this.note = '';
  }

  @action
  update(event) {
    this.draft = event.target.value;
  }

  @action
  save(event) {
    event.preventDefault();
    if (!this.draft.trim()) {
      this.note = 'Paste the key first.';
      return;
    }
    this.api.setWriteKey(this.draft);
    this.note = 'Saved — writes are unlocked in this browser.';
    this.open = false;
    this.args.onSaved?.();
  }

  @action
  forget(event) {
    event.preventDefault();
    this.api.setWriteKey('');
    this.draft = '';
    this.note = 'Key removed; this browser can only read now.';
    this.open = false;
    this.args.onSaved?.();
  }
}
