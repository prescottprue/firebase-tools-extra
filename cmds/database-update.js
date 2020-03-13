/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbWrite } = require('../lib/commands/rtdb');

/**
 * @name databaseUpdate
 * Create test environment config then open Cypress Test Runner
 * @param {string} program - Commander program
 */
module.exports = function databaseUpdateCommand(program) {
  program
    .command('database:update <path> [infile]')
    .description(
      'fetch and print JSON data at the specified path from database emulator'
    )
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use RTDB emulator')
    .action((dbPath, inFile, options) => {
      return rtdbWrite('update', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
