/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbWrite } = require('../lib/commands/rtdb');

/**
 * @name databaseUpdate
 * Create test environment config then open Cypress Test Runner
 * @param {string} program - Commander program
 */
module.exports = function databaseUpdateCommand(program) {
  program
    .command('database:update [path]')
    .description(
      'fetch and print JSON data at the specified path from database emulator'
    )
    .action((opts, dbPath) => {
      return rtdbWrite('update', dbPath, opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
