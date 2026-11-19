import Component from '@glimmer/component';
import { COLORS } from 'web/utils/enums';

export default class ColorDotComponent extends Component {
  get meta() {
    return this.args.color ? (COLORS[this.args.color] || COLORS.OTHER) : null;
  }

  get style() {
    return `background:${this.meta ? this.meta.hex : '#d8d1c4'}`;
  }

  get title() {
    return this.meta ? `${this.meta.ta} · ${this.meta.en}` : '—';
  }
}
