import EmberRouter from '@ember/routing/router';
import config from 'web/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  // Dashboard / Overview
  this.route('dashboard', { path: '/' });

  // Cattle Registry (Bulls & Cows)
  this.route('animals', function () {
    this.route('new'); // /animals/new — fast Gen-0 registration wizard
    this.route('animal', { path: '/:animal_id' }, function () {
      this.route('pedigree');     // /animals/:animal_id/pedigree
      this.route('achievements'); // /animals/:animal_id/achievements
      this.route('gallery');      // /animals/:animal_id/gallery
      this.route('ownership');    // /animals/:animal_id/ownership
      this.route('edit');         // /animals/:animal_id/edit
      this.route('card');         // /animals/:animal_id/card
    });
  });

  // Owners & Breeders Directory
  this.route('owners', function () {
    this.route('new'); // /owners/new
    this.route('owner', { path: '/:owner_id' }, function () {
      this.route('edit'); // /owners/:owner_id/edit
    });
  });

  // Achievements & Hall of Fame
  this.route('achievements', function () {
    this.route('rekla');       // /achievements/rekla
    this.route('jallikattu');  // /achievements/jallikattu
    this.route('shows');       // /achievements/shows
  });

  // Admin review queue — intentionally unlinked; reachable only by typing /admin
  this.route('admin'); // /admin

  // Mating & Lineage Compatibility Simulator
  this.route('mating-planner'); // /mating-planner?sire=:id&dam=:id

  this.route('not-found', { path: '/*path' });
});
