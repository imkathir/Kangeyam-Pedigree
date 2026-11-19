import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AnimalsAnimalIndexRoute extends Route {
  @service api;

  async model() {
    const animal = this.modelFor('animals.animal');
    const pedigree = await this.api.getPedigree(animal.id, 5);

    const ladder = [];
    let known = 0;
    let expected = 0;
    for (let g = 1; g <= 4; g += 1) {
      const row = pedigree.by_generation.find((r) => r.generation === g);
      const count = row ? row.animals.length : 0;
      known += count;
      expected += Math.pow(2, g);
      ladder.push({ generation: g, animals: row ? row.animals : [], expected: Math.pow(2, g), known: count });
    }

    return {
      animal,
      pedigree,
      ladder,
      completeness: expected ? Math.round((known / expected) * 100) : 0,
    };
  }
}
