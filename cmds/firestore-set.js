/* eslint-disable @typescript-eslint/no-var-requires */
const { firestoreWrite } = require('../lib/commands/firestore');

/**
 * @name firestore:set
 * set data to specified path of Firestore. Work for both hosted and emulated environments
 * @param {string} program - Commander program
 */
module.exports = function firestoreSetCommand(program) {
  program
    .command('firestore:set [path] [fixturePath]')
    .description(
      'set data to specified path of Firestore. Work for both hosted and emulated environments'
    )
    .action((opts, dbPath, fixturePath) => {
      return firestoreWrite('set', dbPath, fixturePath, opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
