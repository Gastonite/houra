const Recipe = require('../../../../lib/recipe/recipe');
const recipe1 = require('../../../../lib/recipe/recipe');

module.exports = Recipe({
  id: 'recipe4',
  cwd: __dirname,
  steps: [
    './my-plugin'
  ]
});
