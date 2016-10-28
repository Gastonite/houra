const Joi = require('joi');
const Hoek = require('hoek');
const Directory = require('../directory/directory');
const Promise = require('bluebird');
const Pellmell = require('pellmell');

const internals = {
  find: require('lodash.find')
};

internals.Step = module.exports = (recipe, step) => {

  Hoek.assert(recipe && recipe.isHouraRecipe, `"recipe" param is not a HouraRecipe`);

  if (step && typeof step === 'string') {
    return internals.Step.fromString(recipe, step);
  }

  Joi.assert(step, Joi.object().label('step').required(), `Invalid step:`);
  Joi.assert(step.id, Joi.string().label('id').required(), `Invalid step:`);
  Joi.assert(step.value, Joi.any().label('value').required(), `Invalid "${step.id}" step:`);

  const {id} = step;
  let {value} = step;

  if (typeof value !== 'function') {
    const _value = value;
    value = () => _value;
  }

  // try {
    // Joi.assert(step.from, Joi.string().label('from'));
    //
    // Joi.assert(step.value, Joi.object({
    //   plugin: Joi.object().required(),
    //   options: Joi.object().default()
    // }).label('value').required());
    //
    //
    // const {id, from} = step;
    //
    // const value = Hoek.applyToDefaults({
    //   plugin: {options: {}},
    //   options: {
    //     once: false,
    //     select: [],
    //     routes: {
    //       vhost: void 0,
    //       prefix: void 0
    //     }
    //   }
    // }, step.value);
    //
    // value.plugin.options = Hoek.applyToDefaults(
    //   value.plugin.options,
    //   recipe.config[id] || {}
    // );
    //
    // HapiSchema.apply('plugin', value.plugin);
    // HapiSchema.apply('register', value.options);

    return {
      isStep: true,
      id,
      from: recipe,
      value
    };

  // } catch (err) {
  //   err.message = `Invalid "${id}" step: ${err.message}`;
  //   throw err;
  // }
};

internals.Step.fromString = (recipe, input) => {

  Joi.assert(input, Joi.string().label('input').required());
  input = input.trim();

  if (input.startsWith('./')) {

    input = input.substring(2).split('/');

    input.unshift('plugins');

    let pluginPath = recipe.path.apply(null, input.slice(0, -1));
    const id = input.slice(-1)[0];
    let value;

    try {
      Directory.assert(pluginPath, true);
      value = require(recipe.path.apply(null, input));
      // id = value.register.attributes.name;
    } catch (err) {
      err.message = `Plugin not found: ${err.message}`;
      throw err;
    }

    return internals.Step(recipe, {
      id,
      value: value
    });
  }


  const matches = input.trim().match(/^([a-z0-9\-]+)(?:\:([a-z0-9\-]+))?(?:[ \t]+as[ \t]+([a-z0-9\-\.]+))?$/i);

  Hoek.assert(matches && matches.length, `Invalid step format`);

  let [, stepId, from, alias] = matches;

  const id = alias || stepId;
  let value;

  if (from) {

    const parent = internals.find(recipe.from, ['id', from]);

    Hoek.assert(parent, `Invalid "${stepId}" step: "${recipe.id}" has no "${from}" parent`);
    Hoek.assert(parent.steps.has(stepId), `Invalid "${stepId}" step: "${from}" recipe has no "${stepId}" step defined`);

    return Object.assign({}, parent.steps.get(stepId), {id});
  }

  try {
    value = require.main.require(stepId);
  } catch (err) {
    throw new Error(`Invalid "${id}" step: ${err.message}`)
  }

  return internals.Step(recipe, {id, value});
};