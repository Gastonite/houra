const internals = {};

internals.Plugin3 = module.exports = {};

internals.Plugin3.register = (server, options, next) => {

  next();
};
internals.Plugin3.register.attributes = {
  name: 'plugin3'
};