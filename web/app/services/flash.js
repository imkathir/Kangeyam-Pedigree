import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

let seq = 0;

export default class FlashService extends Service {
  @tracked messages = [];

  push(text, type = 'info') {
    const id = ++seq;
    this.messages = [...this.messages, { id, text, type }];
    setTimeout(() => this.dismiss(id), 5600);
  }

  @action
  success(text) {
    this.push(text, 'success');
  }

  @action
  error(text) {
    this.push(text, 'error');
  }

  @action
  dismiss(id) {
    this.messages = this.messages.filter((m) => m.id !== id);
  }
}
