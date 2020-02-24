/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbRemove } = require('../lib/commands/rtdb');

/**
 * @name databaseGet
 * Create test environment config then open Cypress Test Runner
 * @param {string} program - Commander program
 */
module.exports = function databaseRemoveCommand(program) {
  program
    .command('database:delete [path]')
    .description('delete data from database emulator')
    .action((opts, dbPath) => {
      return rtdbRemove(dbPath, opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
