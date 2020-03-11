/* eslint-disable @typescript-eslint/no-var-requires */
const createCustomToken = require('../lib/commands/createCustomToken');

/**
 * @name createCustomToken
 * Generate a custom auth token
 * @param {string} program - Commander program
 */
module.exports = function createCustomTokenCommand(program) {
  program
    .command('createCustomToken [uid]')
    .description('Generate a custom auth token')
    .action((opts, uid) => {
      return createCustomToken(uid)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
};
