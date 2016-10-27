const internals = {};

internals.Plugin1 = module.exports = {};

internals.Plugin1.register = (server, options, next) => {

  next();
};
internals.Plugin1.register.attributes = {
  name: 'plugin1'
};