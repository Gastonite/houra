const Joi = require('joi');
const Hoek = require('hoek');
const Path = require('path');
const Pellmell = require('pellmell');
const FindPkg = require('find-pkg');
const Promise = require('bluebird');
const Step = require('./../step/step');
const Directory = require('./../directory/directory');

const internals = {
  recipes: {},
  resolve: require('resolve-module-path'),
  isPlainObject: require('lodash.isplainobject'),
  get: require('lodash.get'),
  isIterable: require('@f/is-iterable'),
  slugRegex: /^[a-z0-9\/-]$/i,
  cwd: Path.dirname(FindPkg.sync(process.cwd())),
  schemas: {
    connection: Joi.object({
      labels: Joi.array().items(Joi.string().required()).min(1)
    }).unknown(true).label('connection')
  }
};

internals.makeBag = input => {

  if (!internals.isPlainObject(input)) {
    throw new Error('Cannot make a bag from something other than a plain object');
  }

  return (key, fallback) => {

    if (!key) {
      return input;
    }

    return internals.get(input, key) || fallback;
  }
};

internals.mapify = input => {

  if (!input) {
    throw new Error('Nothing to mapify');
  }

  if (internals.isIterable(input) && typeof input !== 'string') {
    if (!(input instanceof Map)) {

      if (!(input instanceof Array)) {
        input = Array.from(input);
      }

      input = new Map(input.map((v, i) => [''+i, v]));
    }

    return input;
  }

  if (internals.isPlainObject(input)) {
    return new Map(Object.keys(input).map(k => [k, input[k]]));
  }

  throw new Error(`Must be iterable or a plain object (provided: ${typeof input})`);
};

internals.Recipe = module.exports = function (options) {

  if (typeof options === 'string') {
    return internals.Recipe.fromId.apply(null, arguments);
  }

  Joi.assert(options, Joi.object().label('options').required(), `Invalid recipe:`);

  if (options.isHouraRecipe) {
    return options;
  }

  const {id, cwd = internals.cwd, structure} = options;
  let {from = [], connections = internals.defaultConnections, steps = []} = options;
  let path;
  let recipe;

  Joi.assert(id, Joi.string().label('id').required(), `Invalid recipe:`);

  try {

    if (internals.recipes[id]) {
      throw new Error(`A recipe already exists with "${id}" id`);
    }

    Joi.assert(cwd, Joi.string().label('cwd').required());

    Directory.assert(cwd, `"cwd" must refer to an existing directory`);

    path = Directory.makePathMethod(cwd, structure);

    const configPaths = [];

    if (!(from instanceof Array)) {
      from = [from];
    }

    try {
      from = from.map(recipe => {
        const parent = internals.Recipe(recipe);
        configPaths.push(parent.path('config'));
        return parent;
      });
    } catch (err) {
      // const message = err.isJoi && err.details[0].message || err.message;
      err.message = `"from" must be a [recipe|recipeID] or an array of [recipe|recipeID]: ${err.message}`;
      throw err;
    }

    configPaths.push(path('config'));

    const bag = internals.makeBag(
      Pellmell.patch(configPaths, {factory: [], assert: false})
    );

    Joi.assert(connections, Joi.object().pattern(/^[a-z0-9]+$/i, internals.schemas.connection).label('connections'));
    Joi.assert(steps, Joi.array().items(Joi.string()).label('steps'));


    recipe = {
      isHouraRecipe: true,
      id,
      from,
      bag,
      path
    };

    steps = internals.mapify(steps);

    // Hoek.assert(steps.size, `No steps provided`);

    Array.from(steps).forEach(([stepId, step]) => {

      step = Step(recipe, step);

      const key = step.id;

      Hoek.assert(!steps.has(key), `"${key}" step is already defined`);

      // if (config[key]) {
      //   Object.assign(step.registration.options, config[key])
      // }

      steps.set(key, step);
      steps.delete(stepId);
    });

    if (connections) {

      connections = Object.keys(connections).map(key => {

        const connection = connections[key];

        let labels = [key];
        if (connection.labels) {
          labels = labels.concat(connection.labels)
        }

        connection.labels = labels;



        return connection;
      });
    }

  } catch (err) {
    err.message = `Invalid "${id}" recipe: ${err.message}`;
    throw err;
  }

  const cook = (...resolvers) => {

    return Promise.mapSeries(recipe.steps, ([stepId, step], i) => {

      if (typeof step.value === 'function') {
        step.value = step.value({
          id: stepId,
          path: step.from.path,
          bag: internals.makeBag(recipe.bag(stepId, {}))
        });
      }

      if (!resolvers) {
        return step.value;
      }

      return Promise.mapSeries(resolvers, resolver => {

        return typeof resolver === 'function'
          ? resolver(step.value, step.id)
          : resolver;
      });
    });
  };

  return internals.recipes[id] = Object.assign(recipe, {
    steps,
    path,
    cook,
    connections,
    _path: path()
  });
};

internals.Recipe.fromId = (id, options) => {

  Joi.assert(id, Joi.string().regex(/^[a-z0-9\-]+$/i, 'recipeId').label('id').required());

  const {cwd} = Joi.attempt(options, Joi.object({
    cwd: Joi.string().default(internals.cwd)
  }).default().label('options'));

  let recipe = internals.recipes[id];
  if (recipe) {
    return recipe;
  }

  if (!id.startsWith('houra-')) {
    id = 'houra-' + id;
  }

  let recipePath;

  try {
    recipePath = internals.resolve(id, {basePath: cwd});

    if (recipePath.endsWith('houra.yml')) {
      return internals.Recipe.fromFile(Path.dirname(recipePath))
    }

    return internals.Recipe(require.main.require(id));

  } catch (err) {
    throw new Error(`Cannot load "${id}" recipe: ${err.message}`);
  }

};

internals.Recipe.fromFile = cwd => {

  Hoek.assert(Directory.hasFile(cwd, 'houra.yml'), `No "houra.yml" file found: "${cwd}"`);
  let recipe;

  try {
    return internals.Recipe(Pellmell.patch([
      Path.join(cwd, 'houra.yml'),
      {cwd}
    ]));
  } catch (err) {
    throw Error(`Invalid houra.yml file: ${err.stack}`)
  }
};

internals.Recipe.assert = input => {
  Hoek.assert(input && typeof input === 'object' && input.isHouraRecipe === true, `Must be a HouraRecipe`);
  return input;
};