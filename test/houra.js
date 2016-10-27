'use strict';

const Lab =  require('lab');
const Houra = require('../lib/houra/houra');
const Rewire = require('rewire');
const Recipe = Rewire('../lib/recipe/recipe');
const Step = Rewire('../lib/step/step');
const Path = require('path');
const Server = require('hapi/lib/server');
const Should = require('./helpers/should');
const {expect} = require('code');
const Good = require('good');

const {describe, it, before, after, beforeEach, afterEach} = exports.lab = Lab.script();

const  internals = {
  houraPath: Path.join(__dirname, '..')
};


internals.expectServerToBe = state => {
  return server => {

    expect(server).to.be.an.instanceof(Server);
    expect(server._state).to.equal(state);
    expect(server.connections).length(2);
    expect(server.registrations).to.be.null();

    expect(Object.keys(server.connections[0].registrations)).length(3);
    expect(server.connections[0].registrations.good).to.contain({
      name: 'good',
      version: Good.register.attributes.pkg.version
    });
    expect(server.connections[0].registrations.plugin1).to.contain({
      name: 'plugin1',
      options: {ga: 'bu'},
      version: '0.0.0'
    });
    expect(server.connections[0].registrations.plugin2).to.contain({
      name: 'plugin2',
      options: {},
      version: '0.0.0'
    });

    expect(server.connections[1].registrations.good).to.contain({
      name: 'good',
      version: Good.register.attributes.pkg.version
    });
    expect(server.connections[1].registrations.plugin2).to.contain({
      name: 'plugin2',
      options: {},
      version: '0.0.0'
    });
    expect(server.connections[1].registrations.plugin3).to.contain({
      name: 'plugin3',
      options: {},
      version: '0.0.0'
    });

    return server
  }
};

describe('Houra', () => {


  const shouldThrow = (input, message, debug) => Should.throw(Houra, input, message, debug);
  let server;

  let modules = {
    'plugin3': require('./fixtures/plugins/plugin3'),
    'houra-parent1': require('./fixtures/recipes/parent1'),
    'houra-parent2': require('./fixtures/recipes/parent2'),
    // hourafile3: require('./fixtures/recipes/hourafile3'),
    'houra-recipe7': require('./fixtures/recipes/recipe7'),
    'houra-recipe8': require('./fixtures/recipes/recipe8'),
    'houra-recipe9': require('./fixtures/recipes/recipe9')
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

  beforeEach(done => {
    if (server) {
      server.stop();
      // server._eventListeners = null;
    }
    done();
  });

  afterEach(done => {
    if (server) {
      server.stop();
      // server._eventListeners = null;
    }
    done();
  });

  it(`should throw an error if "options" param is invalid`, done => {

    let error = `"options" must be an object`;
    shouldThrow([null, null], err => err.isJoi && err.details[0].message === error);
    shouldThrow([null, 0], err => err.isJoi && err.details[0].message === error);
    shouldThrow([null, 42], err => err.isJoi && err.details[0].message === error);
    shouldThrow([null, ''], err => err.isJoi && err.details[0].message === error);
    shouldThrow([null, []], err => err.isJoi && err.details[0].message === error);

    error = `No "houra.yml" file found: "${internals.houraPath}"`;
    shouldThrow([null, void 0], `No "houra.yml" file found: "${internals.houraPath}"`);
    shouldThrow([null, {}], error);
    shouldThrow([null, {relativeTo: internals.houraPath}], error);

    done();
  });

  it(`should search a houra.yml file if no "recipe" param is provided`, () => {


    return Houra(null, {
      relativeTo: Path.join(__dirname, 'fixtures', 'recipes', 'hourafile2')
    }).then(result => {
      server = result;

      expect(server).to.be.an.instanceof(Server);
      expect(server._state).to.equal('stopped');
      expect(server.connections).length(1);

      expect(server.registrations).to.be.an.object();
      expect(Object.keys(server.registrations)).to.have.length(1);
      expect(server.registrations.good).to.contain({
        name: 'good',
        version: Good.register.attributes.pkg.version
      });

      expect(server.connections[0].registrations).to.equal(server.registrations);

    });

  });


  it('should throw an error if multiple step have the same id', () => {
    const shouldThrow = (input, message, debug) => Should.throwAsync(Houra, input, message, debug);

    return shouldThrow(['recipe7'], `Cannot load "houra-recipe7" recipe: Invalid "recipe7" recipe: "custom-plugin1" step is already defined`)
  });


  it('should start a server with the default connection', () => {

    return Houra.start('recipe8')

      .then(result => {
        server = result;

        expect(server).to.be.an.instanceof(Server);
        expect(server._state).to.equal('started');
        expect(server.connections).length(1);
        expect(server.connections[0].registrations).to.be.object();

        expect(Object.keys(server.connections[0].registrations)).length(4);

        expect(server.connections[0].registrations.good).to.contain({
          name: 'good',
          version: Good.register.attributes.pkg.version
        });
        expect(server.connections[0].registrations.plugin1).to.contain({
          name: 'plugin1',
          options: {ga: 'bu'},
          version: '0.0.0'
        });
        expect(server.connections[0].registrations.plugin2).to.contain({
          name: 'plugin2',
          options: {},
          version: '0.0.0'
        });
        expect(server.connections[0].registrations.plugin3).to.contain({
          name: 'plugin3',
          options: {},
          version: '0.0.0'
        });

      });
    // return shouldThrow(['recipe7'], `Cannot load "houra-recipe7" recipe: Invalid "recipe7" recipe: "plugin1" step is already defined`)
  });

  it('should create a server', () => {

    return Houra('recipe9')
      .then(internals.expectServerToBe('stopped'))
      .then(result => {
        server = result;
      });
    // return shouldThrow(['recipe7'], `Cannot load "houra-recipe7" recipe: Invalid "recipe7" recipe: "plugin1" step is already defined`)
  });

  it('should initialize a server', () => {

    return Houra.initialize('recipe9')
      .then(internals.expectServerToBe('initialized'))
      .then(result => {
        server = result;
      });
    // return shouldThrow(['recipe7'], `Cannot load "houra-recipe7" recipe: Invalid "recipe7" recipe: "plugin1" step is already defined`)
  });

  it('should start a server', () => {

    const recipe8 = Recipe('recipe8');

    return Houra.start('recipe9')
      .then(internals.expectServerToBe('started'))
      .then(result => {
        server = result;
      });
    // return shouldThrow(['recipe7'], `Cannot load "houra-recipe7" recipe: Invalid "recipe7" recipe: "plugin1" step is already defined`)
  });
});
