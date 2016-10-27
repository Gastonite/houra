const internals = {};

internals.Plugin2 = module.exports = {};

internals.Plugin2.register = (server, options, next) => {

  next();
};
internals.Plugin2.register.attributes = {
  name: 'plugin2'
};