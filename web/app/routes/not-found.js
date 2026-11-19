import Route from '@ember/routing/route';

export default class NotFoundRoute extends Route {
  model({ path }) {
    return { path };
  }
}
