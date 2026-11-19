import { helper } from '@ember/component/helper';

export default helper(function lte([a, b]) {
  return Number(a) <= Number(b);
});
