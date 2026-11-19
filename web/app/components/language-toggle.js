import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class LanguageToggleComponent extends Component {
  @service i18n;

  @action
  set(locale) {
    this.i18n.setLocale(locale);
  }
}
