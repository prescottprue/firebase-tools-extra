/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbWrite } = require('../lib/commands/rtdb');

/**
 * @name databaseSet
 * store JSON data at the specified path
 * @param {string} program - Commander program
 */
module.exports = function databaseSetCommand(program) {
  program
    .command('database:set [path]')
    .description('store JSON data at the specified path')
    .action((opts, dbPath) => {
      return rtdbWrite('set', dbPath, opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
