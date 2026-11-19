import Helper from '@ember/component/helper';
import { service } from '@ember/service';

/** {{tr "Dashboard"}} or {{tr "Registered {{name}}" name=this.animal.name_en}} */
export default class TrHelper extends Helper {
  @service i18n;

  compute([text], params) {
    return this.i18n.translate(text, params);
  }
}
