import Helper from '@ember/component/helper';
import { service } from '@ember/service';

/** The name in the *other* language, for the secondary line. */
export default class Nm2Helper extends Helper {
  @service i18n;

  compute([record]) {
    return this.i18n.altName(record);
  }
}
