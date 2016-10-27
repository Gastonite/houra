const Recipe = require('../../../../lib/recipe/recipe');

module.exports = Recipe({
  id: 'recipe5',
  from: require('../recipe4'),
  cwd: __dirname
});
