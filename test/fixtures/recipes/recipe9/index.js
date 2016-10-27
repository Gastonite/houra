const Recipe = require('../../../../lib/recipe/recipe');

module.exports = {
  id: 'recipe9',
  cwd: __dirname,
  from: ['parent1', 'parent2'],
  steps: [
    'custom-plugin1:parent1 as custom-alias',
    './custom-plugin2',
    'plugin3 as another-alias'
  ],
  connections: {
    conn1: {
      host: 'localhost',
      port: 3000,
      plugins: ['custom-plugin2', 'custom-alias']

    },
    conn2: {
      host: 'localhost',
      port: 3001,
      plugins: ['another-alias', 'custom-plugin2']
    }
  }
};