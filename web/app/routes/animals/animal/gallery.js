import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsAnimalGalleryRoute extends Route {
  @service api;

  async model() {
    const animal = this.modelFor('animals.animal');
    const media = await this.api.listMedia(animal.id);
    return { animal, media };
  }
}
