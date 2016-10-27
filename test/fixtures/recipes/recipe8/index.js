const Recipe = require('../../../../lib/recipe/recipe');

module.exports = {
  id: 'recipe8',
  cwd: __dirname,
  from: ['parent1', 'parent2'],
  steps: [
    'custom-plugin1:parent1 as custom-alias',
    './custom-plugin2',
    'plugin3 as another-alias'
  ]
};
