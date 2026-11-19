import { helper } from '@ember/component/helper';

export default helper(function lt([a, b]) {
  return Number(a) < Number(b);
});
