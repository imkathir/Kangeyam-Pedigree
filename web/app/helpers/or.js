import { helper } from '@ember/component/helper';

export default helper(function or(params) {
  return params.find((v) => v) ?? params[params.length - 1];
});
