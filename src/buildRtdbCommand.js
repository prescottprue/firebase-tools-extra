import { isObject } from 'lodash';
import { addDefaultArgs, getArgsString } from './utils';
import { FIREBASE_TOOLS_BASE_COMMAND, DEFAULT_TEST_FOLDER_PATH, DEFAULT_FIXTURE_FOLDER_PATH } from './constants';

/**
 * Build Command to run Real Time Database action. All commands call
 * firebase-tools directly, so FIREBASE_TOKEN must exist in environment.
 * @param  {String} action - action to run on Firstore (i.e. "add", "delete")
 * @param  {String} actionPath - Firestore path where action should be run
 * @param  {String|Object} fixturePath - Path to fixture. If object is passed,
 * it is used as options.
 * @param  {Object} [opts={}] - Options object
 * @param  {Object} opts.args - Extra arguments to be passed with command
 * @return {String} Command string to be used with cy.exec
 */
export default function buildRtdbCommand(action, actionPath, fixturePath, opts = {}) {
  const options = isObject(fixturePath) ? fixturePath : opts;
  const { args = [] } = options;
  const argsWithDefaults = addDefaultArgs(args);
  const argsStr = getArgsString(argsWithDefaults);
  switch (action) {
    case 'delete':
      return `${FIREBASE_TOOLS_BASE_COMMAND} database:${action} ${actionPath}${argsStr}`;
    case 'get': {
      const getDataArgsWithDefaults = addDefaultArgs(args, { disableYes: true });
      const getDataArgsStr = getArgsString(getDataArgsWithDefaults);
      return `${FIREBASE_TOOLS_BASE_COMMAND} database:${action} /${actionPath}${getDataArgsStr}`;
    }
    default: {
      const fullPathToFixture = `${DEFAULT_TEST_FOLDER_PATH}/${DEFAULT_FIXTURE_FOLDER_PATH}/${fixturePath}`;
      return `${FIREBASE_TOOLS_BASE_COMMAND} database:${action} /${actionPath} ${fullPathToFixture}${argsStr}`;
    }
  }
}
