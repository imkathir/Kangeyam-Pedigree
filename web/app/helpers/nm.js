import Helper from '@ember/component/helper';
import { service } from '@ember/service';

/** Primary name of an animal/owner in the active language. */
export default class NmHelper extends Helper {
  @service i18n;

  compute([record]) {
    return this.i18n.name(record);
  }
}
