'use strict';

const Lab =  require('lab');
const Houra = require('../lib/houra/houra');
const Recipe = require('../lib/recipe/recipe');
const Rewire = require('rewire');
const Step = Rewire('../lib/step/step');
const Path = require('path');
// const Server = require('glue/node_modules/hapi/lib/server');
const Should = require('./helpers/should');
const {expect} = require('code');

const {describe, it, before, after, afterEach, beforeEach} = exports.lab = Lab.script();

const internals = {};


internals.recipe1 = require('./fixtures/recipes/recipe1');
internals.recipe2 = require('./fixtures/recipes/recipe2');
internals.recipe3 = require('./fixtures/recipes/recipe3');
internals.recipe4 = require('./fixtures/recipes/recipe4');
internals.recipe5 = require('./fixtures/recipes/recipe5');

internals.plugin1 = require('./fixtures/plugins/plugin1');

internals.registrations = {
  plugin1: {
    plugin: {
      register: internals.plugin1.register,
      options: {}
    },
    options: {
      once: false,
      select: [],
      routes: {
        vhost: void 0,
        prefix: void 0
      }
    }
  }
};


describe('Step', () => {

  it(`should not create a step if "recipe" param is not a HouraRecipe`, done => {

    const shouldThrow = (input, message, debug) => Should.throw(Step, input, message, debug);

    shouldThrow([], `"recipe" param is not a HouraRecipe`);
    shouldThrow([null], `"recipe" param is not a HouraRecipe`);
    shouldThrow([void 0], `"recipe" param is not a HouraRecipe`);
    shouldThrow([false], `"recipe" param is not a HouraRecipe`);
    shouldThrow([0], `"recipe" param is not a HouraRecipe`);
    shouldThrow([''], `"recipe" param is not a HouraRecipe`);
    shouldThrow([{ga: 'bu', zo: 'meu'}], `"recipe" param is not a HouraRecipe`);

    done()
  });

  it(`should not create a step if invalid "step" param is provided`, done => {

    const shouldThrow = (input, message, debug) => Should.throw(Step, [internals.recipe1].concat(input), message, debug);

    shouldThrow([], `Invalid step: "step" is required`);
    shouldThrow([void 0], `Invalid step: "step" is required`);
    shouldThrow([false], `Invalid step: "step" must be an object`);
    shouldThrow([0], `Invalid step: "step" must be an object`);
    shouldThrow([''], `Invalid step: "step" must be an object`);

    shouldThrow([null], err => err.isJoi && err.details[0].message === '"step" must be an object');

    shouldThrow([{ga: 'bu', zo: 'meu'}], `Invalid step: "id" is required`);
    shouldThrow([{id: 'bu', zo: 'meu'}], `Invalid "bu" step: "value" is required`);
    // shouldThrow([{id: 'bu', value: 'meu'}], `Invalid "bu" step: "value" must be an object`);
    // shouldThrow([{id: 'bu', value: {}}], err => err.isJoi && err.details[0].message === `"plugin" is required`);
    // shouldThrow([{id: 'bu', value: {plugin: 42}}], err => err.isJoi && err.details[0].message === `"plugin" must be an object`);
    // shouldThrow([{
    //   id: 'bu',
    //   value: {
    //     plugin: {}
    //   }
    // }], `Invalid "bu" step: Invalid plugin options {\n  "options": {},\n  \u001b[41m"register"\u001b[0m\u001b[31m [1]: -- missing --\u001b[0m\n}\n\u001b[31m\n[1] "register" is required\u001b[0m`);
    // shouldThrow([{
    //   id: 'bu',
    //   value: {
    //     plugin: {
    //       register: 42
    //     }
    //   }
    // }], `Invalid "bu" step: Invalid plugin options {\n  "options": {},\n  "register" \u001b[31m[1]\u001b[0m: 42\n}\n\u001b[31m\n[1] "register" must be a Function\u001b[0m`);

    done()
  });

  it(`should not create a step`, done => {

    expect(Step(internals.recipe1, {
      id: 'bu',
      value: {plugin: internals.plugin1}
    })).to.include({
      isStep: true,
      id: 'bu',
      from: internals.recipe1
    });

    done();
  })
});


describe('Step.fromString', () => {
  let revertRequire;
  const shouldThrow = (input, message, debug) => Should.throw(Step.fromString, input, message, debug);

  const modules = {
    plugin1: internals.plugin1
  };

  beforeEach(done =>  {
    const _require = Step.__get__('require.main.require');
    revertRequire = Step.__set__({
      'require.main.require': fileName => {
        return modules[fileName] || _require(fileName)
      }
    });
    done();
  });

  afterEach(done =>  {
    revertRequire();
    done();
  });

  it(`should not create a step if "input" param is not a string`, done => {

    shouldThrow([internals.recipe1], `"input" is required`);
    shouldThrow([internals.recipe1, void 0], `"input" is required`);
    shouldThrow([internals.recipe1, null], err => err.isJoi && err.details[0].message === `"input" must be a string`);
    shouldThrow([internals.recipe1, 0], `"input" must be a string`);
    shouldThrow([internals.recipe1, false], `"input" must be a string`);
    shouldThrow([internals.recipe1, true], `"input" must be a string`);
    shouldThrow([internals.recipe1, ''], `"input" is not allowed to be empty`);

    done()
  });

  it(`should not create a step if "input" param format is invalid`, done => {

    shouldThrow([internals.recipe1, '$"(pm_uVYèg'], `Invalid step format`);
    shouldThrow([internals.recipe1, 'N7cpm_uVYIX_L4'], `Invalid step format`);

    done()
  });

  it(`should not create a step from a local plugin if plugin does not exist`, done => {

    shouldThrow([internals.recipe1, './plugin1'], `Plugin not found: Not a directory: "${internals.recipe1.path('plugins')}"`);
    shouldThrow([internals.recipe2, './plugin1'], `Plugin not found: Cannot find module '${internals.recipe2.path('plugins')}/plugin1'`);

    done();
  });

  it(`should create a step from a local plugin`, done => {

    const step = Step(internals.recipe3, './my-plugin');

    expect(step).to.include({
      isStep: true,
      id: 'my-plugin',
      from: internals.recipe3,
    });
    expect(step.value).to.be.a.function();
    done()
  });

  it(`should not create a step from a module name if module is not installed`, done => {

    shouldThrow([internals.recipe2, 'vision'], `Invalid "vision" step: Cannot find module \'vision\'`);
    done();
  });

  it(`should create a step from a module name`, done => {

    const step = Step(internals.recipe1, 'plugin1');

    expect(step).to.include({
      isStep: true,
      id: 'plugin1',
      from: internals.recipe1
    });
    expect(step.value).to.be.a.function();

    done()
  });

  it(`should create a step from a module name (with an alias)`, done => {

    const step = Step(internals.recipe1, 'plugin1 as my-alias');

    expect(step).to.include({
      isStep: true,
      id: 'my-alias',
      from: internals.recipe1
    });
    expect(step.value).to.be.a.function();

    done()
  });

  it(`should inherit a step from a parent recipe`, done => {

    const step = Step(internals.recipe5, 'my-plugin:recipe4');

    expect(step).to.include({
      isStep: true,
      id: 'my-plugin',
      from: internals.recipe4
    });
    expect(step.value).to.be.a.function();

    done()
  });

});
