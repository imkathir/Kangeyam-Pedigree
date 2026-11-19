import { helper } from '@ember/component/helper';

export default helper(function slice([array, start, end]) {
  if (!Array.isArray(array)) return [];
  const from = Number(start) || 0;
  const to = end === undefined ? array.length : Number(end);
  return array.slice(from, to);
});
