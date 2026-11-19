import { helper } from '@ember/component/helper';

export default helper(function sub([a, b]) {
  return Number(a) - Number(b);
});
