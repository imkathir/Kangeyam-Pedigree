import Helper from '@ember/component/helper';
import { service } from '@ember/service';

/** {{lbl this.animal.labels.current_color}} → the Tamil or English half of a label pair. */
export default class LblHelper extends Helper {
  @service i18n;

  compute([pair]) {
    return this.i18n.label(pair);
  }
}
