const Recipe = require('../../../../lib/recipe/recipe');

module.exports = {
  id: 'recipe7',
  cwd: __dirname,
  from: ['parent1', 'parent2'],
  steps: [
    './custom-plugin1',
    'custom-plugin2:parent2',
    'custom-plugin1:parent1 as custom-plugin3'
  ]
};

// id: hourafile3
// from:
//   - parent1
//   - parent2
// steps:
