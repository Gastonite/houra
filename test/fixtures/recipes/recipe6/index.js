const Recipe = require('../../../../lib/recipe/recipe');

module.exports = Recipe({
  id: 'recipe6',
  cwd: __dirname,
  steps: [
    './path/to/plugin3'
  ]
});
