Package.describe({
  name: 'c0r3y8:octopus-cache',
  version: '0.2.1',
  // Brief, one-line summary of the package.
  summary: 'Cache module for Octopus',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/C0r3y8/octopus-cache.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

const basePackages = {
  server: [ 'c0r3y8:octopus@0.2.1', 'ecmascript', 'ejson', 'meteor' ]
};

const testPackages = [
  'http',
  'practicalmeteor:mocha',
  'practicalmeteor:mocha-console-runner',
  'practicalmeteor:chai',
  'practicalmeteor:sinon',
  'react-meteor-data'
];

Npm.depends({
  assert: '1.4.1',
  warning: '3.0.0'
});

/* eslint-disable func-names, prefer-arrow-callback */
Package.onUse(function (api) {
  api.versionsFrom('1.4.2.3');

  api.use(basePackages.server, 'server');

  api.use('tmeasday:check-npm-versions@0.3.1');

  api.mainModule('server/index.js', 'server');
});
/* eslint-enable */

/* eslint-disable func-names, prefer-arrow-callback */
Package.onTest(function (api) {
  api.use(basePackages.server, 'server');

  api.use(testPackages);

  api.use('c0r3y8:octopus-cache');

  api.addFiles('server/cache-tests.js', 'server');
});
/* eslint-enable */
