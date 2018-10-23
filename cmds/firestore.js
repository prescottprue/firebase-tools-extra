/**
 * createTestEnvFile commander component
 * To use add require('../cmds/deploy.js')(program) to your commander.js based node executable before program.parse
 */

const firestoreAction = require('../lib/commands/firestore').default;
const chalk = require('chalk');


/**
 * @name createTestEnvFile
 * @description Deploy to Firebase only on build branches (master, stage, prod)
 * @param {String} only - Only flag can be passed to deploy only specified
 * targets (e.g hosting, storage)
 * @example <caption>Basic</caption>
 * # make sure you serviceAccount.json exists
 * cypress-firebase createEnv
 */
module.exports = function (program) {
  program
    .command('firestore')
    .description(
      'Build configuration file containing a token for authorizing a firebase instance'
    )
    .action((directory, options) =>
      firestoreAction(program.args[0], directory, options)
        .then(() => process.exit(0))
        .catch((err) => {
          console.log(chalk.red(`Error creating test env file:\n${err.message}`)); // eslint-disable-line no-console
          process.exit(1);
          return Promise.reject(err);
        })
    );
};
