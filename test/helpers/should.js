const {expect} = require('code');
const Joi = require('joi');
const Promise = require('bluebird');

const internals = {};

internals.expectError = (err, errorMessage, debug) => {

  if (debug) {
    console.error(err.stack);
  }
  expect(err).to.exist();

  if (typeof errorMessage === 'function') {
    expect(err).to.satisfy(errorMessage);
  } else {
    expect(err.message).to.equals(errorMessage);
  }

  return err;
};

exports.throw = (fn, input, errorMessage, debug) => {
  let error;
  try {
    const recipe = fn.apply(null, input);
  } catch (err) {
    error = internals.expectError(err, errorMessage, debug);
  }
  expect(error).to.be.an.instanceof(Error);
};

exports.throwAsync = (fn, input, errorMessage, debug) => {

  return Promise.method(fn).apply(null, input).then(result => {
    expect(result).to.not.exist();
  }).catch(err => {
    internals.expectError(err, errorMessage, debug);
  });
};