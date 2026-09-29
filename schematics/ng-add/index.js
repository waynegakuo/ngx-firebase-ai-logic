const { schematic } = require('@angular-devkit/schematics');

/**
 * @param {import('./schema.json')} options
 */
function ngAdd(options) {
  return schematic('setup', options);
}

module.exports = ngAdd;
