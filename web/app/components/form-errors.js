import Component from '@glimmer/component';

export default class FormErrorsComponent extends Component {
  get list() {
    const e = this.args.errors;
    if (!e) return [];
    if (Array.isArray(e)) return e;
    return [String(e)];
  }

  get hasErrors() {
    return this.list.length > 0;
  }
}
