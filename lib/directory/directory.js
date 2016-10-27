const Fs = require('fs');
const Joi = require('joi');
const Path = require('path');


const internals = {
  slugRegex: /^[a-z0-9\/-]+$/i,
  trim: require('lodash.trim')
};

internals.getStats = (path, {symlinks = true} = {}) => {

  let stats;
  try {
    stats = Fs.lstatSync(path);

    // if (symlinks && stats && stats.isSymbolicLink()) {
    //   stats = Fs.lstatSync(Fs.readlinkSync(path));
    // }

    return stats;
  } catch (err) {}
};

exports.assert = (path, assert = true, options) => {

  const stats = internals.getStats(path, options);

  if (stats && stats.isDirectory()) {
    return path;
  }

  if (assert) {
    assert = typeof assert === 'string'
      ? `${assert}: `
      : '';
  }

  const provided = typeof path === 'string'
    ? ': "'+path+'"'
    : ` (provided: ${typeof path})`;

  if (typeof assert !== 'string' && !assert) {
    return false;
  }

  throw new Error(`${assert}Not a directory${provided}`);
};

exports.hasFile = (cwd, file, assert, options) => {

  exports.assert(cwd, true, options);

  Joi.assert(file, Joi.string().label('file').required());

  const path = Path.join(cwd, file);
  const stats = internals.getStats(path);

  if (stats && stats.isFile()) {
    return path;
  }

  return false;
};

exports.makePathMethod = (cwd, structure = {}) => {

  exports.assert(cwd, 'Invalid "cwd" param');

  Joi.assert(structure, Joi.object().pattern(
    internals.slugRegex,
    Joi.string().regex(internals.slugRegex, 'slug')
  ).label('structure'));

  structure = Object.keys(structure).reduce((before, key) => {

    before[internals.trim(key, '/')] = internals.trim(structure[key], '/');
    return before;
  }, {});

  return (...args) => {

    if (!args.length) {
      return cwd;
    }

    if (!args.every(arg => typeof arg === 'string')) {
      throw new Error(`Path method only accept string arguments`);
    }

    const findCommonPath = args => {

      if (!args.length) {
        return;
      }

      let found = structure[args.join('/')];
      if (found) {
        return found.split('/');
        // return found.concat(args.slice(found.length - args.length));
      }

      const commonPath = findCommonPath(args.slice(0, -1));

      if (!commonPath) {
        return args;
      }

      return commonPath.concat(args.slice(-1))
    };

    args = findCommonPath(args);

    args.unshift(cwd);

    return Path.join.apply(Path, args);
  };
};