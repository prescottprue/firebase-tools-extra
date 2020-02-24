/* eslint-disable @typescript-eslint/no-var-requires */
const { firestoreWrite } = require('../lib/commands/firestore');

/**
 * @name firestore:update
 * update data at specified path of Firestore. Work for both hosted and emulated environments
 * @param {string} program - Commander program
 */
module.exports = function run(program) {
  program
    .command('firestore:update [path] [fixturePath]')
    .description(
      'update data at specified path of Firestore. Work for both hosted and emulated environments'
    )
    .action((opts, dbPath, fixturePath) => {
      return firestoreWrite('update', dbPath, fixturePath, opts)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
