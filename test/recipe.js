'use strict';

const Lab =  require('lab');
const Houra = require('../lib/houra/houra');
const Hoek = require('hoek');
const Rewire =  require('rewire');
const Recipe = Rewire('../lib/recipe/recipe');
const Step = Rewire('../lib/step/step');
const Path = require('path');
// const Server = require('glue/node_modules/hapi/lib/server');
const Should = require('./helpers/should');
const {expect} = require('code');

const {describe, it, after, before} = exports.lab = Lab.script();

const internals = {};

const defaultRegistrationOptions = {
  once: false,
  select: [],
  routes: {
    vhost: void 0,
    prefix: void 0
  }
};


describe('_mapify', () => {
  const _mapify = Recipe.__get__('internals.mapify');
  const shouldThrow = (input, message, debug) => Should.throw(_mapify, input, message, debug);

  it(`should throw an error if "input" param is invalid`, done => {
    shouldThrow([], `Nothing to mapify`);
    shouldThrow([void 0], `Nothing to mapify`);
    shouldThrow([null], `Nothing to mapify`);
    shouldThrow([0], `Nothing to mapify`);
    shouldThrow([''], `Nothing to mapify`);
    shouldThrow(['hello'], `Must be iterable or a plain object (provided: string)`);
    shouldThrow([new Date()], `Must be iterable or a plain object (provided: object)`);
    done();
  });

  it(`should return input if it's already a Map object`, done => {
    const map = new Map([
      ['ga', 'bu'],
      ['zo', 'meu']
    ]);

    expect(_mapify(map)).to.equal(map);

    done();
  });

  it(`should transform a plain object to a Map object`, done => {
    const map = _mapify({ga: 'bu', zo: 'meu'});

    expect(map).to.be.instanceof(Map);
    expect(Array.from(map)).to.equal([
      ['ga', 'bu'],
      ['zo', 'meu']
    ]);
    done();
  });

  it(`should transform an array to a Map object`, done => {
    const map = _mapify(['bu', 'meu']);

    expect(map).to.be.instanceof(Map);
    expect(Array.from(map)).to.equal([
      ['0', 'bu'],
      ['1', 'meu']
    ]);
    done();
  });

  it(`should transform an iterable object to a Map object`, done => {
    let iterable = {
      0: 'ga',
      1: 'bu',
      2: 'zo',
      length: 3,
      [Symbol.iterator]: Array.prototype[Symbol.iterator]
    };

    const map = _mapify(iterable);

    expect(map).to.be.instanceof(Map);
    expect(Array.from(map)).to.equal([
      ['0', 'ga'],
      ['1', 'bu'],
      ['2', 'zo']
    ]);
    done();
  });

});

describe('Recipe', () => {
  const shouldThrow = (input, message, debug) => Should.throw(Recipe, input, message, debug);


  const modules = {
    plugin1: require('./fixtures/plugins/plugin1'),
    plugin2: require('./fixtures/plugins/plugin2')
  };

  let revertRequire;
  before(done =>  {
    const _require = Step.__get__('require.main.require');
    revertRequire = Step.__set__({
      'require.main.require': fileName => {
        return modules[fileName] || _require(fileName)
      }
    });
    done();
  });

  after(done =>  {
    revertRequire();
    done();
  });


  it(`should not create a recipe if "options" param is invalid`, done => {

    let error = `Invalid recipe: "options" is required`;
    shouldThrow([], error);
    shouldThrow([void 0], error);

    error = `"options" must be an object`
    shouldThrow([0], `Invalid recipe: ${error}`);
    shouldThrow([null], err => err.isJoi && err.details[0].message === error);
    shouldThrow([false], `Invalid recipe: ${error}`);
    shouldThrow([42], `Invalid recipe: ${error}`);

    shouldThrow([{}], `Invalid recipe: "id" is required`);

    error = `"id" must be a string`;
    shouldThrow([{id: 42}], `Invalid recipe: ${error}`);
    shouldThrow([{id: null}], err => err.isJoi && err.details[0].message === error);
    shouldThrow([{id: false}], `Invalid recipe: ${error}`);
    shouldThrow([{id: true}], `Invalid recipe: ${error}`);

    error = `"cwd" must be a string`;
    shouldThrow([{id: '42', cwd: 42}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', cwd: null}], err => err.isJoi && err.details[0].message === error);
    shouldThrow([{id: '42', cwd: false}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', cwd: true}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', cwd: 'invalid-path'}], `Invalid "42" recipe: "cwd" must refer to an existing directory: Not a directory: "invalid-path"`);

    error = `"structure" must be an object`;
    shouldThrow([{id: '42', structure: 0}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', structure: null}], err => err.isJoi && err.details[0].message === error);
    shouldThrow([{id: '42', structure: false}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', structure: true}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', structure: []}], err => err.isJoi && err.details[0].message === error);
    shouldThrow([{id: '42', structure: 'invalid-sructure'}], `Invalid "42" recipe: ${error}`);

    error = `"connections" must be an object`;
    shouldThrow([{id: '42', connections: null}], err => err.isJoi && err.details[0].message === error);
    shouldThrow([{id: '42', connections: false}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', connections: true}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', connections: 0}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', connections: 42}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', connections: []}], err => err.isJoi && err.details[0].message === error);

    error = `"steps" must be an array`;
    shouldThrow([{id: '42', steps: null}], err => err.isJoi && err.details[0].message === error);
    shouldThrow([{id: '42', steps: false}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', steps: true}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', steps: 0}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', steps: 42}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', steps: ''}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', steps: 'string'}], `Invalid "42" recipe: ${error}`);
    shouldThrow([{id: '42', steps: {}}], err => err.isJoi && err.details[0].message === error);


    error = `Invalid "42" recipe: "from" must be a [recipe|recipeID] or an array of [recipe|recipeID]`;

    shouldThrow([{id: '42', from: null}], `${error}: Invalid recipe: {\n  \u001b[41m"options"\u001b[0m\u001b[31m [1]: -- missing --\u001b[0m\n}\n\u001b[31m\n[1] "options" must be an object\u001b[0m`);
    shouldThrow([{id: '42', from: false}], `${error}: Invalid recipe: "options" must be an object`);
    shouldThrow([{id: '42', from: true}], `${error}: Invalid recipe: "options" must be an object`);
    shouldThrow([{id: '42', from: 0}], `${error}: Invalid recipe: "options" must be an object`);
    shouldThrow([{id: '42', from: 42}], `${error}: Invalid recipe: "options" must be an object`);
    shouldThrow([{id: '42', from: 'string'}], `${error}: Cannot load "houra-string" recipe: Cannot find module \'houra-string\'`);
    shouldThrow([{id: '42', from: ''}], `${error}: "id" is not allowed to be empty`);
    shouldThrow([{id: '42', from: {}}], `${error}: Invalid recipe: "id" is required`);

    done();
  });

  it(`should create a recipe`, () => {

    const recipe = internals.recipe42 = Recipe({
      id: '42',
      steps: ['plugin1']
    });

    expect(recipe).to.be.an.object();

    expect(recipe.isHouraRecipe).to.equals(true);
    expect(recipe.id).to.equals('42');
    expect(recipe.from).to.equals([]);
    expect(recipe.connections).to.equals(void 0);
    expect(recipe.steps.size).to.equals(1);

    expect(recipe.steps.get('plugin1')).to.contains({
      isStep: true,
      id: 'plugin1',
      from: recipe
    });
    expect(recipe.steps.get('plugin1').value).to.be.function();

    return recipe.cook().then(steps => {

      // const plugin = recipe.steps.get('plugin1');
      expect(recipe.steps.get('plugin1')).to.contains({
        isStep: true,
        id: 'plugin1',
        from: recipe,
        value: {
          register: modules.plugin1.register,
          options: {
            ga: 'bu'
          }
          // plugin: {
          //   options: {},
          //   register: modules.plugin1.register
          // },
          // options: defaultRegistrationOptions
        }
      });
    }).catch(err => {
      console.error(err.stack);
    });
  });

  it(`should not create two recipes with the same id`, done => {

    shouldThrow([{id: '42'}], `Invalid "42" recipe: A recipe already exists with "42" id`);
    done();
  });

  it(`should return recipe if is already loaded`, done => {

    expect(Recipe('42')).to.equal(internals.recipe42);
    // shouldThrow(['42'], `Invalid "42" recipe: A recipe already exists with "42" id`);
    done();
  });

  it(`should return input if it's already a HouraRecipe`, done => {

    const recipe = Recipe({
      id: 'fsfgsfd',
      steps: ['plugin1']
    });

    expect(Recipe(recipe)).to.equal(recipe);

    done();
  });

  it ('should inherit steps and config from another recipe', () => {

    const parent1 = Recipe(require('./fixtures/recipes/parent1'));

    const recipe = Recipe({
      id: 'recipe1',
      from: parent1,
      steps: [
        'custom-plugin1:parent1'
      ]
    });

    expect(recipe.isHouraRecipe).to.equals(true);
    expect(recipe.id).to.equals('recipe1');
    expect(recipe.from).to.equals([parent1]);
    expect(recipe.connections).to.equals(void 0);

    expect(recipe.steps.size).to.equals(1);
    expect(recipe.steps.get('custom-plugin1')).to.contains({
      isStep: true,
      id: 'custom-plugin1',
      from: parent1
    });
    expect(recipe.steps.get('custom-plugin1').value).to.be.function();

    return recipe.cook().then(steps => {

      expect(recipe.steps.get('custom-plugin1').value).to.equals(modules.plugin1);
    });
  });

  it ('should inherit steps and config from multiple other recipes', done => {

    const parent1 = Recipe('parent1');
    const parent2 = Recipe(require('./fixtures/recipes/parent2'));

    const recipe = Recipe({
      id: 'recipe2',
      from: [parent1, parent2],
      steps: [
        'custom-plugin2:parent2',
        'custom-plugin1:parent1'
      ]
    });

    expect(recipe.isHouraRecipe).to.equals(true);
    expect(recipe.id).to.equals('recipe2');
    expect(recipe.from).to.equals([parent1, parent2]);
    expect(recipe.connections).to.equals(void 0);

    expect(recipe.steps.size).to.equals(2);
    expect(recipe.steps.get('custom-plugin2')).to.contains({
      isStep: true,
      id: 'custom-plugin2',
      from: parent2
    });
    expect(recipe.steps.get('custom-plugin2').value).to.be.function();
    expect(recipe.steps.get('custom-plugin1')).to.contains({
      isStep: true,
      id: 'custom-plugin1',
      from: parent1
    });
    expect(recipe.steps.get('custom-plugin1').value).to.be.function();

    return recipe.cook().then(steps => {

      expect(recipe.steps.get('custom-plugin1').value).to.equals(modules.plugin1);
      expect(recipe.steps.get('custom-plugin2').value).to.equals(modules.plugin2);
    });
    // expect(Array.from(recipe.steps)).to.equals([
    //   ['modules.plugin1plugin2', {
    //     isStep: true,
    //     id: 'custom-plugin2',
    //     from: parent2,
    //     value: modules.plugin2
    //   }],
    //   ['modules.plugin1plugin1', {
    //     isStep: true,
    //     id: 'custom-plugin1',
    //     from: parent1,
    //     value: modules.plugin1
    //   }]
    // ]);

  });

  it ('should create a recipe with custom connections', done => {

    const recipe = Recipe({
      id: 'recipe3',
      steps: ['plugin1'],
      connections: {
        web: {host: 'localhost', port: 3000},
        api: {host: 'localhost', port: 3001}
      }
    });

    expect(recipe.isHouraRecipe).to.equals(true);
    expect(recipe.id).to.equals('recipe3');
    expect(recipe.from).to.equals([]);
    expect(recipe.connections).to.equals([
      {host: 'localhost', port: 3000, labels: ['web']},
      {host: 'localhost', port: 3001, labels: ['api']}
    ]);
    expect(recipe.steps.size).to.equals(1);
    expect(recipe.steps.get('plugin1')).to.contains({
      isStep: true,
      id: 'plugin1',
      from: recipe
    });
    expect(recipe.steps.get('plugin1').value).to.be.function();


    return recipe.cook().then(() => {

      expect(recipe.steps.get('plugin1').value).to.equals(modules.plugin1);
    });
  });

  it ('should create a recipe with custom connections (selecting plugins)', done => {

    const recipe = Recipe({
      id: 'recipe4',
      steps: ['plugin2', 'plugin1'],
      connections: {
        web: {host: 'localhost', port: 3000, plugins: ['plugin2'], labels: ['other-label']},
        api: {host: 'localhost', port: 3001, plugins: ['plugin1']}
      }
    });

    expect(recipe.isHouraRecipe).to.equals(true);
    expect(recipe.id).to.equals('recipe4');
    expect(recipe.from).to.equals([]);
    expect(recipe.connections).to.equals([
      {host: 'localhost', port: 3000, plugins: ['plugin2'], labels: ['web', 'other-label']},
      {host: 'localhost', port: 3001, plugins: ['plugin1'], labels: ['api']}
    ]);

    expect(Array.from(recipe.steps.keys())).to.equals([
      'plugin2',
      'plugin1'
    ]);

    const [step1, step2] = Array.from(recipe.steps.values());

    expect(step1).to.contains({
      isStep: true,
      id: 'plugin2',
      from: recipe
    });
    expect(step1.value).to.be.function();

    expect(step2).to.contains({
      isStep: true,
      id: 'plugin1',
      from: recipe
    });
    expect(step2.value).to.be.function();

    return recipe.cook().then(() => {
      expect(step1.value).to.equals(modules.plugin2);
      expect(step2.value).to.equals(modules.plugin1);
    });

    // expect(Array.from(recipe.steps)).to.equals([
    //   ['plugin1', {
    //     isStep: true,
    //     id: 'plugin1',
    //     from: recipe,
    //     value: {
    //       plugin: {
    //         options: {},
    //         register: modules.plugin1.register
    //       },
    //       options: Hoek.applyToDefaults(defaultRegistrationOptions, {select: ['api']})
    //     }
    //   }],
    //   ['plugin2', {
    //     isStep: true,
    //     id: 'plugin2',
    //     from: recipe,
    //     value: {
    //       plugin: {
    //         options: {},
    //         register: modules.plugin2.register
    //       },
    //       options: Hoek.applyToDefaults(defaultRegistrationOptions, {select: ['web']})
    //     }
    //   }]
    // ]);

  });
});

describe('Recipe.fromId', () => {

  const shouldThrow = (input, message, debug) => Should.throw(Recipe.fromId, input, message, debug);

  const modules = {
    'houra-recipe6': require('./fixtures/recipes/recipe6'),
    plugin1: require('./fixtures/plugins/plugin1'),
    plugin2: require('./fixtures/plugins/plugin2')
  };

  let revertRequire;
  before(done =>  {

    revertRequire = [
      Recipe.__get__('require.main.require'),
      Step.__get__('require.main.require')
    ].map(_require => Recipe.__set__({
      'require.main.require': fileName => {
        return modules[fileName] || _require(fileName)
      }
    }));

    done();
  });

  after(done =>  {
    revertRequire.forEach(revert => revert());
    done();
  });


  it('should return a previously loaded recipe', done => {
    expect(Recipe.fromId('42')).to.equal(internals.recipe42);
    done();
  });

  it('should throw an error if invalid "options" param is provided', done => {

    shouldThrow(['42', 0], err => err.isJoi && err.details[0].message === '"options" must be an object');
    shouldThrow(['42', null], err => err.isJoi && err.details[0].message === '"options" must be an object');
    shouldThrow(['42', false], err => err.isJoi && err.details[0].message === '"options" must be an object');
    shouldThrow(['42', 42], err => err.isJoi && err.details[0].message === '"options" must be an object');
    shouldThrow(['42', {cwd: 0}], err => err.isJoi && err.details[0].message === '"cwd" must be a string');
    shouldThrow(['42', {cwd: null}], err => err.isJoi && err.details[0].message === '"cwd" must be a string');
    shouldThrow(['42', {cwd: false}], err => err.isJoi && err.details[0].message === '"cwd" must be a string');
    shouldThrow(['42', {cwd: ''}], err => err.isJoi && err.details[0].message === '"cwd" is not allowed to be empty');

    done();
  });

  it('should throw an error if no recipe is found', done => {

    shouldThrow(['43'], 'Cannot load "houra-43" recipe: Cannot find module \'houra-43\'');

    done();
  });

  it('should require an external recipe', done => {

    let recipe = Recipe.fromId('recipe6');
    expect(recipe).to.equals(Recipe.fromId('houra-recipe6'));
    expect(recipe).to.equals(modules['houra-recipe6']);

    expect(recipe.isHouraRecipe).to.equals(true);
    expect(recipe.id).to.equal('recipe6');
    expect(recipe.from).to.equals([]);
    expect(recipe.connections).to.equals(void 0);
    expect(recipe.steps.size).to.equals(1);
    expect(Array.from(recipe.steps.keys())).to.equals(['plugin3']);

    const [step1] = Array.from(recipe.steps.values());

    expect(step1).to.contains({
      isStep: true,
      id: 'plugin3',
      from: recipe
    });
    expect(step1.value).to.be.function();

    return recipe.cook().then(() => {
      expect(step1.value).to.equals(require('./fixtures/plugins/plugin3'));
    });
  });

  it('should require an external recipe (via houra.yml file)', done => {

    let recipe = Recipe.fromId('recipe');

    expect(recipe).to.be.an.object();
    expect(recipe.isHouraRecipe).to.equals(true);
    expect(recipe.id).to.equals('recipe');
    expect(recipe.from).to.equals([]);
    expect(recipe.connections).to.equals(void 0);

    expect(recipe.steps.size).to.equals(1);
    expect(Array.from(recipe.steps.keys())).to.equals(['my-plugin']);

    const [step1] = Array.from(recipe.steps.values());
    expect(step1).to.contains({
      isStep: true,
      id: 'my-plugin',
      from: recipe
    });
    expect(step1.value).to.be.function();

    // expect(Array.from(recipe.steps)).to.equals([
    //   ['my-plugin', {
    //     isStep: true,
    //     id: 'my-plugin',
    //     from: recipe,
    //     value: {
    //       plugin: {
    //         options: {},
    //         register: require('houra-recipe/plugins/to/my-plugin').register
    //       },
    //       options: defaultRegistrationOptions
    //     }
    //   }]
    // ]);

    return recipe.cook().then(() => {

      expect(step1.value).to.equals(require('houra-recipe/plugins/to/my-plugin'));
    });
  });
});

describe('Recipe.assert', () => {

  const shouldThrow = (input, message, debug) => Should.throw(Recipe.assert, input, message, debug);

  it ('should throw an error if "input" param is not a HouraRecipe object', done => {

    const error = `Must be a HouraRecipe`;
    shouldThrow([], error);
    shouldThrow([void 0], error);
    shouldThrow([null], error);
    shouldThrow([false], error);
    shouldThrow([0], error);
    shouldThrow([42], error);
    shouldThrow([''], error);
    shouldThrow(['zo'], error);
    shouldThrow([[]], error);
    shouldThrow([{}], error);
    shouldThrow([{ga: 'bu'}], error);
    shouldThrow([{ga: 'bu', isHouraRecipe: 0}], error);
    shouldThrow([{ga: 'bu', isHouraRecipe: void 0}], error);
    shouldThrow([{ga: 'bu', isHouraRecipe: null}], error);
    shouldThrow([{ga: 'bu', isHouraRecipe: false}], error);
    shouldThrow([{ga: 'bu', isHouraRecipe: 42}], error);
    shouldThrow([{ga: 'bu', isHouraRecipe: ''}], error);
    shouldThrow([{ga: 'bu', isHouraRecipe: 'meu'}], error);

    done();
  })
  it (`should return "input" param if it's a HouraRecipe object`, done => {

    const recipe = {ga: 'bu', isHouraRecipe: true};
    expect(Recipe.assert(recipe)).to.equal(recipe);

    done();
  })
});

describe('Recipe.fromFile', () => {

  const shouldThrow = (input, message, debug) => Should.throw(Recipe.fromFile, input, message, debug);


  it('should throw an error if "cwd" param is invalid', done => {
    shouldThrow([], `Not a directory (provided: undefined)`);
    shouldThrow([void 0], `Not a directory (provided: undefined)`);
    shouldThrow([null], `Not a directory (provided: object)`);
    shouldThrow([false], `Not a directory (provided: boolean)`);
    shouldThrow([0], `Not a directory (provided: number)`);
    shouldThrow([''], `Not a directory: ""`);
    shouldThrow(['invalid-path'], `Not a directory: "invalid-path"`);
    shouldThrow([__dirname], `No "houra.yml" file found: "${__dirname}"`);

    done();
  });

  it('should throw an error if houra.yml file is invalid', done => {
    shouldThrow([Path.join(__dirname, 'fixtures', 'recipes', 'hourafile1')], `Invalid houra.yml file: Invalid recipe: "id" is required`);

    done();
  });
});
