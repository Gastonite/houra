const Recipe = require('../../../../lib/recipe/recipe');

module.exports = {
  id: 'parent1',
  cwd: __dirname,
  steps: ['./custom-plugin1'],
  structure: {
    'config': 'conf'
  }
};
