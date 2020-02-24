/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbGet } = require('../lib/commands/rtdb');

/**
 * @name databaseGet
 * fetch and print JSON data at the specified path from database emulator
 * @param {string} program - Commander program
 */
module.exports = function databaseGetCommand(program) {
  program
    .command('database:get [path]')
    .description(
      'fetch and print JSON data at the specified path from database emulator'
    )
    .option('--shallow', 'return shallow response')
    .option('--order-by <key>', 'select a child key by which to order results')
    .option('--limit-to-first <num>', 'limit to the first <num> results')
    .option('--limit-to-last <num>', 'limit to the last <num> results')
    .action((opts, dbPath) => {
      return rtdbGet(dbPath, opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
