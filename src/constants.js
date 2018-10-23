export const DEFAULT_TEST_FOLDER_PATH = 'test/e2e';
export const DEFAULT_FIXTURE_FOLDER_PATH = 'fixtures';
export const CONTAINER_BUILDS_META_PATH = 'container_builds';
export const DEFAULT_SERVICE_ACCOUNT_PATH = 'serviceAccount.json';
export const DEFAULT_TEST_ENV_FILE_PATH = 'cypress.env.json';
export const DEFAULT_CONFIG_FILE_PATH = 'config.json';
// Path for firebase-tools command (npx is used so that local version is used by default
// falling back to the globally installed instance)
export const FIREBASE_TOOLS_BASE_COMMAND = 'npx firebase';
// Path to Firebase Extra Command Line tool (wrapper for firebase-tools)
export const FIREBASE_EXTRA_PATH = '$(npm bin)/firebase-tools-extra';
export const FIREBASE_TOOLS_YES_ARGUMENT = '-y';
export const DEFAULT_BASE_PATH = process.cwd();
