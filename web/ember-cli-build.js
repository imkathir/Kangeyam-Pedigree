'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    // Self-hosted Tamil webfont lives in public/fonts and must keep its name.
    fingerprint: { exclude: ['fonts/', 'media/'] },
  });

  return app.toTree();
};
