import { helper } from '@ember/component/helper';

export default helper(function eq([a, b]) {
  return a === b || String(a) === String(b);
});
