/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbWrite } = require('../lib/commands/rtdb');

/**
 * @name databasePush
 * Create test environment config then open Cypress Test Runner
 * @param {string} program - Commander program
 */
module.exports = function databasePushCommand(program) {
  program
    .command('database:push [path]')
    .description('add a new JSON object to a list of data in your Firebase')
    .action((opts, dbPath) => {
      return rtdbWrite('push', dbPath, opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
