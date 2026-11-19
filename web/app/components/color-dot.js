import Component from '@glimmer/component';
import { COLORS } from 'web/utils/enums';

export default class ColorDotComponent extends Component {
  get meta() {
    return COLORS[this.args.color] || COLORS.OTHER;
  }

  get style() {
    return `background:${this.meta.hex}`;
  }

  get title() {
    return `${this.meta.ta} · ${this.meta.en}`;
  }
}
