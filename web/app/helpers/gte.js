import { helper } from '@ember/component/helper';

export default helper(function gte([a, b]) {
  return Number(a) >= Number(b);
});
