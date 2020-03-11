/* eslint-disable @typescript-eslint/no-var-requires */
const { rtdbWrite } = require('../lib/commands/rtdb');

/**
 * @name databaseSet
 * store JSON data at the specified path
 * @param {string} program - Commander program
 */
module.exports = function databaseSetCommand(program) {
  program
    .command('database:set <path> [infile]')
    .description('store JSON data at the specified path')
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .action((dbPath, inFile, options) => {
      return rtdbWrite('set', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
