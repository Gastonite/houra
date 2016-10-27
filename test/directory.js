'use strict';

const Lab =  require('lab');
const Houra = require('../lib/houra/houra');
const Recipe = require('../lib/recipe/recipe');
const Rewire =  require('rewire');
const {Stats} =  require('fs');
const Directory = Rewire('../lib/directory/directory');
const Step = require('../lib/step/step');
const Path = require('path');
// const Server = require('glue/node_modules/hapi/lib/server');
const Should = require('./helpers/should');
const {expect} = require('code');

const {describe, it, afterEach, beforeEach} = exports.lab = Lab.script();


describe('internals.getStats', () => {
  const _getStats = Directory.__get__('internals.getStats');

  it(`should return false if "path" param is invalid`, done => {

    expect(_getStats()).to.not.exist();
    expect(_getStats(0)).to.not.exist();
    expect(_getStats(42)).to.not.exist();
    expect(_getStats(true)).to.not.exist();
    expect(_getStats(false)).to.not.exist();
    expect(_getStats('')).to.not.exist();
    expect(_getStats([])).to.not.exist();
    expect(_getStats({})).to.not.exist();
    expect(_getStats('/an/inexistant/path/on/the/file/system')).to.not.exist();

    done();
  });

  it(`should return file stats`, done => {
    const stats = _getStats(__dirname);
    expect(stats).to.be.an.instanceof(Stats);
    expect(stats.isDirectory()).to.equal(true);
    done();
  });

  // it(`should throw an error if assertion is not a string`, done => {
  //   const stats = _getStats(__dirname);
  //   expect(stats).to.be.an.instanceof(Stats);
  //   expect(stats.isDirectory()).to.equal(true);
  //   done();
  // })
});

describe('Directory.assert', () => {

  let shouldThrow = (input, message, debug) => Should.throw(Directory.assert, input, message, debug);

  it(`should throw an error if "path" param is invalid`, done => {

    shouldThrow(['invalid-path'], 'Not a directory: "invalid-path"');
    shouldThrow(['/an/invalid/path'], 'Not a directory: "/an/invalid/path"');
    shouldThrow([], `Not a directory (provided: undefined)`);
    shouldThrow([void 0], `Not a directory (provided: undefined)`);
    shouldThrow([false], `Not a directory (provided: boolean)`);
    shouldThrow([null], `Not a directory (provided: object)`);
    shouldThrow([''], `Not a directory: ""`);
    shouldThrow(['/an/inexistant/path/on/the/file/system'], `Not a directory: "/an/inexistant/path/on/the/file/system"`);

    done();
  });

  it(`should prefix error message if assert is a string`, done => {

    shouldThrow(['invalid-path', Object], 'Not a directory: "invalid-path"');
    shouldThrow(['invalid-path', {}], 'Not a directory: "invalid-path"');
    shouldThrow(['invalid-path', []], 'Not a directory: "invalid-path"');
    shouldThrow(['invalid-path', true], 'Not a directory: "invalid-path"');

    done();
  });

  it(`should return false "assert" param is a non-string falsy value`, done => {


    expect(Directory.assert('invalid-path', null)).to.be.false();
    expect(Directory.assert('invalid-path', 0)).to.be.false();
    expect(Directory.assert('invalid-path', false)).to.be.false();
    done();
  });

  it(`should throw an error if path is not a directory (when assertion message is provided)`, done => {

    const prefix = 'Error prefix';

    shouldThrow(
      [__filename, prefix],
      `Error prefix: Not a directory: "${__filename}"`
    );
    shouldThrow(
      [__filename, prefix],
      `Error prefix: Not a directory: "${__filename}"`
    );

    const _shouldThrow = (path, message, debug) => shouldThrow([path, prefix], message, debug);

    _shouldThrow('/an/inexistant/path/on/the/file/system', 'Error prefix: Not a directory: "/an/inexistant/path/on/the/file/system"');
    _shouldThrow(void 0, 'Error prefix: Not a directory (provided: undefined)');
    _shouldThrow(null, 'Error prefix: Not a directory (provided: object)');
    _shouldThrow(false, 'Error prefix: Not a directory (provided: boolean)');
    _shouldThrow(0, 'Error prefix: Not a directory (provided: number)');
    _shouldThrow('', 'Error prefix: Not a directory: ""');
    _shouldThrow(42, 'Error prefix: Not a directory (provided: number)');
    _shouldThrow(true, 'Error prefix: Not a directory (provided: boolean)');
    _shouldThrow([], 'Error prefix: Not a directory (provided: object)');
    _shouldThrow({}, 'Error prefix: Not a directory (provided: object)');
    _shouldThrow(() => {}, 'Error prefix: Not a directory (provided: function)');

    done();
  });

  it(`should return provided "path"`, done => {

    expect(Directory.assert(__dirname)).to.equal(__dirname);

    done();
  });
});

describe('Directory.hasFile', () => {

  let shouldThrow = (input, message, debug) => Should.throw(Directory.hasFile, input, message, debug);

  it(`should throw error if "cwd" param is invalid`, done => {

    shouldThrow([], 'Not a directory (provided: undefined)');
    shouldThrow([null], 'Not a directory (provided: object)');
    shouldThrow([false], 'Not a directory (provided: boolean)');
    shouldThrow([''], 'Not a directory: ""');
    shouldThrow([true], 'Not a directory (provided: boolean)');
    shouldThrow([42], 'Not a directory (provided: number)');
    shouldThrow([[]], 'Not a directory (provided: object)');
    shouldThrow([{}], 'Not a directory (provided: object)');

    done();
  });

  it(`should throw error if "file" param is invalid`, done => {

    shouldThrow([__dirname], '"file" is required');
    shouldThrow([__dirname, Object], '"file" must be a string');
    shouldThrow([__dirname, {}], err => err.isJoi && err.details[0].message === '"file" must be a string');
    shouldThrow([__dirname, []], err => err.isJoi && err.details[0].message === '"file" must be a string');
    shouldThrow([__dirname, false], '"file" must be a string');
    shouldThrow([__dirname, true], '"file" must be a string');

    done();
  });

  it(`should return false if "cwd" param refers to an inexistant directory`, done => {

    expect(Directory.hasFile(__dirname, '/an/inexistant/path/on/the/file/system')).to.equal(false);

    done();
  });

  it(`should return false if "cwd" param refers to an inexistant directory`, done => {

    expect(Directory.hasFile(__dirname, __dirname)).to.equal(false);

    done();
  });

  it(`should return false if "file" is not a file`, done => {

    expect(Directory.hasFile(__dirname, 'fixtures')).to.equal(false);

    done();
  });

  it(`should return file path`, done => {

    const currentFileName = Path.basename(__filename);
    expect(Directory.hasFile(__dirname, currentFileName)).to.equal(Path.join(__dirname, currentFileName));

    done();
  });

});

describe('Directory.makePathMethod', () => {

  let shouldThrow = (input, message, debug) => Should.throw(Directory.makePathMethod, input, message, debug);

  it(`should throw error if "cwd" param is invalid`, done => {

    shouldThrow([], 'Invalid "cwd" param: Not a directory (provided: undefined)');

    done();
  });

  it(`should throw error if "structure" param is invalid`, done => {
    const pathMethod = Directory.makePathMethod(__dirname);

    const _shouldThrow = (input, message, debug) => Should.throw(pathMethod, input, message, debug);

    _shouldThrow([void 0], 'Path method only accept string arguments');
    _shouldThrow([0], 'Path method only accept string arguments');
    _shouldThrow([42], 'Path method only accept string arguments');
    _shouldThrow([false], 'Path method only accept string arguments');
    _shouldThrow([true], 'Path method only accept string arguments');
    _shouldThrow([{}], 'Path method only accept string arguments');
    _shouldThrow([[]], 'Path method only accept string arguments');

    done();
  });

  it(`should return the directory path if no params are provided`, done => {

    const pathMethod = Directory.makePathMethod(__dirname);


    expect(pathMethod).to.be.a.function();
    expect(pathMethod()).to.equal(__dirname);
    // shouldThrow([], 'Invalid "cwd" param: Not a directory (provided: undefined)');

    done();
  });

  it(`should just proxy Path.join if no "structure" param is provided`, done => {
    const pathMethod = Directory.makePathMethod(__dirname);


    expect(pathMethod('test')).to.equal(Path.join(__dirname, 'test'));
    expect(pathMethod('one', 'two', 'three')).to.equal(Path.join(__dirname, 'one', 'two', 'three'));
    // const _shouldThrow = (childPath, message, debug) => Should.throw(pathMethod, [childPath], message, debug);
    //
    // _shouldThrow('inexistant', `No "inexistant" path is defined in structure configuration`);
    // _shouldThrow(42, `Invalid "key" param: Not a string (provided: number)`);
    // _shouldThrow(true, `Invalid "key" param: Not a string (provided: boolean)`);

    done();
  });

  it(`should replace the common part of path if found in structure`, done => {
    const pathMethod = Directory.makePathMethod(__dirname, {
      'one/two': 'zero'
    });


    expect(pathMethod('test')).to.equal(Path.join(__dirname, 'test'));
    expect(pathMethod('one', 'two', 'three')).to.equal(Path.join(__dirname, 'zero', 'three'));
    // const _shouldThrow = (childPath, message, debug) => Should.throw(pathMethod, [childPath], message, debug);
    //
    // _shouldThrow('inexistant', `No "inexistant" path is defined in structure configuration`);
    // _shouldThrow(42, `Invalid "key" param: Not a string (provided: number)`);
    // _shouldThrow(true, `Invalid "key" param: Not a string (provided: boolean)`);

    done();
  });

  it(`should not return child directory path if "key" param does not exists in structure`, done => {

    const childPath = Path.join(__dirname, 'fixtures');
    const pathMethod = Directory.makePathMethod(__dirname, {ga: 'fixtures'});

    expect(pathMethod).to.be.a.function();
    expect(pathMethod('ga')).to.equal(childPath);


    done();
  });

});
