import { helper } from '@ember/component/helper';

export default helper(function and(params) {
  const last = params[params.length - 1];
  return params.every((v) => v) ? last : params.find((v) => !v);
});
