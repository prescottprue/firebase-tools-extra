/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbGet } = require('../lib/commands/rtdb');

/**
 * @name databaseGet
 * fetch and print JSON data at the specified path from database emulator
 * @param {object} program - Commander program
 */
module.exports = function databaseGetCommand(program) {
  program
    .command('database:get [path]')
    .description(
      'fetch and print JSON data at the specified path from database emulator'
    )
    .option('--shallow', 'return shallow response')
    .option('--order-by <key>', 'select a child key by which to order results')
    .option('--order-by-key', 'order by key name')
    .option('--order-by-value', 'order by primitive value')
    .option('--limit-to-first <num>', 'limit to the first <num> results')
    .option('--limit-to-last <num>', 'limit to the last <num> results')
    .option(
      '--start-at <val>',
      'start results at <val> (based on specified ordering)'
    )
    .option(
      '--end-at <val>',
      'end results at <val> (based on specified ordering)'
    )
    .option(
      '--equal-to <val>',
      'restrict results to <val> (based on specified ordering)'
    )
    .option('--emulator', 'use RTDB emulator')
    .action((dbPath, options) => {
      return rtdbGet(dbPath, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
