const Hoek = require('hoek');
const Joi = require('joi');
const Glue = require('glue');
const Path = require('path');
const FindPkg = require('find-pkg');
const Recipe = require('./../recipe/recipe');
const HapiSchema = require('hapi/lib/schema');

const internals = {
  cwd: Path.dirname(FindPkg.sync(process.cwd()))
};
internals.defaults = {
  server: {
    app: {}
  }
};
internals.schemas = {};

internals.Houra = module.exports = (recipe, options) => {

  const {relativeTo} = Joi.attempt(options, Joi.object({
    relativeTo: Joi.string().default(internals.cwd)
  }).default().label('options'));

  if (!recipe) {
    recipe = Recipe.fromFile(relativeTo);
  }

  if (typeof recipe === 'string') {
    recipe = Recipe.fromId(recipe, {cwd: relativeTo});
  }

  Recipe.assert(recipe);

  const server = Object.assign({}, internals.defaults.server);
  const glueManifest = {server, connections: recipe.connections};

  const preConnections = (server, next) => {
    next();
  };

  const preRegister = (server, next) => {

    server.register([
      {
        register: require('good'),
        options: {
          ops: {
            interval: 1000
          },
          reporters: {
            console: [{
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ request: '*', log: '*', response: '*', error: '*'}]
            }, {
              module: 'good-console'
            }, 'stdout']
          }
        }
      }
    ], next);
  };

  const glueOptions = {relativeTo, preRegister, preConnections};

  internals.Houra.path = recipe.path;


  if (recipe.connections) {
    recipe.connections.forEach(conn => {

      // registration.options.select.push(stepId);

      if (conn.plugins instanceof Array) {

        conn.plugins = conn.plugins.reduce((plugins, pluginId) => {

          Joi.assert(pluginId, Joi.string().label('pluginId').required());

          plugins[pluginId] = {};

          return plugins;
        }, {});

      }
    });

  }


  return Glue.compose(glueManifest, glueOptions).then(server => {

    const registerPlugin = (registration, stepId) => {

      if (!registration || !registration.plugin) {

        registration = {
          plugin: registration
        };
      }

      if (typeof registration.plugin === 'string') {

        registration.plugin = require.main.require(registration.plugin);
      }

      registration.options = Hoek.applyToDefaults({
        once: false,
        select: [],
        routes: {
          vhost: void 0,
          prefix: void 0
        }
      }, registration.options || {});

      if (recipe.connections) {
        recipe.connections.forEach(conn => {

          if (conn.plugins && conn.plugins[stepId]) {

            registration.options.select.push(conn.labels[0]);
          }
        });

      }

      registration.plugin.options = Hoek.applyToDefaults(
        recipe.bag(stepId, {}),
        registration.plugin.options || {}
      );

      return server.register(registration.plugin, registration.options).then(() => {

        server.log(['info', 'start', stepId], `Registered`);
      });
    };

    return recipe.cook(registerPlugin).then(() => server);

  }).catch(err => console.error(err.stack));
};

internals.Houra.initialize = options => {

  return internals.Houra(options).then(server => {

    return server.initialize().then(() => server);
  });
};

internals.Houra.start = options => {

  return internals.Houra.initialize(options).then(server => {

    return server.start().then(() => {


      server.connections.forEach(conn => {

        server.log(['info', 'start'], `Server is listening on ${conn.info.uri} via "${conn.settings.labels[0] || 'default'}" connection [${Object.keys(conn.registrations)}]`);
      });

      server.log(['info', 'start'], "Houra !");

      return server;
    });
  });
};