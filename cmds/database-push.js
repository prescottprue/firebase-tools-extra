/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbWrite } = require('../lib/commands/rtdb');

/**
 * @name databasePush
 * Create test environment config then open Cypress Test Runner
 * @param {object} program - Commander program
 */
module.exports = function databasePushCommand(program) {
  program
    .command('database:push <path> [infile]')
    .description('add a new JSON object to a list of data in your Firebase')
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use RTDB emulator')
    .action((dbPath, inFile, options) => {
      return rtdbWrite('push', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
