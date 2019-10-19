export const DEFAULT_TEST_FOLDER_PATH = 'test/e2e';
export const FALLBACK_TEST_FOLDER_PATH = 'cypress';
export const DEFAULT_SERVICE_ACCOUNT_PATH = 'serviceAccount.json';
export const DEFAULT_TEST_ENV_FILE_PATH = 'cypress.env.json';
export const DEFAULT_CONFIG_FILE_PATH = 'config.json';
// Path for firebase-tools command (npx is used so that local version is used by default
// falling back to the globally installed instance)
export const FIREBASE_TOOLS_BASE_COMMAND = '$(npm bin)/firebase';
// Path to Firebase Extra Command Line tool (wrapper for firebase-tools)
export const FIREBASE_EXTRA_PATH = '$(npm bin)/firebase-extra';
export const FIREBASE_TOOLS_YES_ARGUMENT = '-y';
