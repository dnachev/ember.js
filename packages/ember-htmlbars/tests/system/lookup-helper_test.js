import lookupHelper, { findHelper } from 'ember-htmlbars/system/lookup-helper';
import ComponentLookup from 'ember-views/component_lookup';
import Helper, { helper as makeHelper } from 'ember-htmlbars/helper';
import { OWNER } from 'container/owner';
import buildOwner from 'container/tests/test-helpers/build-owner';

function generateEnv(helpers, owner) {
  return {
    owner: owner,
    helpers: (helpers ? helpers : {}),
    hooks: { keywords: {} },
    knownHelpers: {}
  };
}

function generateOwner() {
  let owner = buildOwner();

  owner.register('component-lookup:main', ComponentLookup);

  return owner;
}

QUnit.module('ember-htmlbars: lookupHelper hook');

QUnit.test('looks for helpers in the provided `env.helpers`', function() {
  let env = generateEnv({
    'flubarb'() { }
  });

  let actual = lookupHelper('flubarb', null, env);

  equal(actual, env.helpers.flubarb, 'helpers are looked up on env');
});

QUnit.test('returns undefined if no container exists (and helper is not found in env)', function() {
  let env = generateEnv();
  let view = {};

  let actual = findHelper('flubarb', view, env);

  equal(actual, undefined, 'does not blow up if view does not have a container');
});

QUnit.test('does not lookup in the container if the name does not contain a dash (and helper is not found in env)', function() {
  let env = generateEnv();
  let view = {
    container: {
      lookup() {
        ok(false, 'should not lookup in the container');
      }
    }
  };

  let actual = findHelper('flubarb', view, env);

  equal(actual, undefined, 'does not blow up if view does not have a container');
});

QUnit.test('does a lookup in the container if the name contains a dash (and helper is not found in env)', function() {
  let owner = generateOwner();
  let env = generateEnv(null, owner);
  let view = {
    [OWNER]: owner
  };

  let someName = Helper.extend();
  owner.register('helper:some-name', someName);

  let actual = lookupHelper('some-name', view, env);

  ok(someName.detect(actual), 'helper is an instance of the helper class');
});

QUnit.test('does a lookup in the container if the name is found in knownHelpers', function() {
  let owner = generateOwner();
  let env = generateEnv(null, owner);
  let view = {
    [OWNER]: owner
  };

  env.knownHelpers['t'] = true;
  let t = Helper.extend();
  owner.register('helper:t', t);

  let actual = lookupHelper('t', view, env);

  ok(t.detect(actual), 'helper is an instance of the helper class');
});

QUnit.test('looks up a shorthand helper in the container', function() {
  expect(2);
  let owner = generateOwner();
  let env = generateEnv(null, owner);
  let view = {
    [OWNER]: owner
  };
  let called;

  function someName() {
    called = true;
  }
  owner.register('helper:some-name', makeHelper(someName));

  let actual = lookupHelper('some-name', view, env);

  ok(actual.isHelperInstance, 'is a helper');

  actual.compute([], {});

  ok(called, 'HTMLBars compatible wrapper is wraping the provided function');
});

QUnit.test('fails with a useful error when resolving a function', function() {
  expect(1);
  let owner = generateOwner();
  let env = generateEnv(null, owner);
  let view = {
    [OWNER]: owner
  };

  function someName() {}
  owner.register('helper:some-name', someName);

  let actual;
  expectAssertion(() => {
    actual = lookupHelper('some-name', view, env);
  }, 'Expected to find an Ember.Helper with the name helper:some-name, but found an object of type function instead.');
});

