/* eslint-disable @typescript-eslint/no-var-requires */
const { firestoreGet } = require('../lib/commands/firestore');

/**
 * @name firestoreGet
 * fetch and print JSON data at the specified path of Firestore. Works for both hosted and emulated environments
 * @param {string} program - Commander program
 */
module.exports = function firestoreGetCommand(program) {
  program
    .command('firestore:get [path]')
    .description(
      'fetch and print JSON data at the specified path of Firestore. Works for both hosted and emulated environments'
    )
    .option('-o, --output <filename>', 'save output to the specified file')
    .action((dbPath, opts) => {
      return firestoreGet(dbPath, opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
