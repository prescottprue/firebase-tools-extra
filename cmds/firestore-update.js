/* eslint-disable @typescript-eslint/no-var-requires */
const { firestoreWrite } = require('../lib/commands/firestore');

/**
 * @name firestoreUpdate
 * update data at specified path of Firestore. Work for both hosted and emulated environments
 * @param {string} program - Commander program
 */
module.exports = function firestoreUpdateCommand(program) {
  program
    .command('firestore:update <path> [infile]')
    .description(
      'update data at specified path of Firestore. Work for both hosted and emulated environments'
    )
    .option('-d, --data <data>', 'specify escaped JSON directly')
    .option('--emulator', 'use Firestore emulator')
    .action((dbPath, inFile, options) => {
      return firestoreWrite('update', dbPath, inFile, options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
