import * as admin from "firebase-admin";
import { get } from "lodash";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { DEFAULT_TEST_FOLDER_PATH, FALLBACK_TEST_FOLDER_PATH } from "./constants";

export const DEFAULT_BASE_PATH = process.cwd();

/**
 * Check whether a value is a string or not
 * @param valToCheck - Value to check
 * @returns Whether or not value is a string
 */
export function isString(valToCheck: any): boolean {
  return typeof valToCheck === 'string' || valToCheck instanceof String
}

/**
 * Get settings from firebaserc file
 * @param filePath - Path for file
 * @returns Firebase settings object
 */
export function readJsonFile(filePath: string): any {
  if (!existsSync(filePath)) {
    return {};
  }

  try {
    const fileBuffer = readFileSync(filePath, 'utf8')
    return JSON.parse(fileBuffer.toString());
  } catch (err) {
    /* eslint-disable no-console */
    console.error(
      `Unable to parse ${filePath.replace(
        DEFAULT_BASE_PATH,
        ""
      )} - JSON is most likley not valid`
    );
    /* eslint-enable no-console */
    return {};
  }
}

/**
 * Parse fixture path string into JSON with error handling
 * @param unparsed - Unparsed string to be parsed into JSON
 * @returns Parsed fixture value or path
 */
export function parseFixturePath(unparsed: string): any {
  if (isString(unparsed)) {
    try {
      return JSON.parse(unparsed);
    } catch (err) {
      return unparsed;
    }
  }
  return unparsed;
}

/**
 * Get slug representing the environment (from CI environment variables).
 * Defaults to "stage"
 * @returns Environment slug
 */
function getEnvironmentSlug(): string {
  return (
    process.env.CI_ENVIRONMENT_SLUG || process.env.CI_COMMIT_REF_SLUG || "stage"
  );
}

/**
 * Get prefix for current environment based on environment vars available
 * within CI. Falls back to staging (i.e. STAGE)
 * @param envName - Environment option
 * @returns Environment prefix string
 */
function getEnvPrefix(envName?: string): string {
  const envSlug = envName || getEnvironmentSlug();
  return `${envSlug.toUpperCase()}_`;
}

/**
 * Get path to local service account
 * @param envName - Environment option
 * @returns Path to service account
 */
function getServiceAccountPath(envName?: string): string {
  const withSuffix = join(
    DEFAULT_BASE_PATH,
    `serviceAccount-${envName || ''}.json`,
  );
  if (existsSync(withSuffix)) {
    return withSuffix;
  }
  return join(DEFAULT_BASE_PATH, 'serviceAccount.json');
}

/**
 * Get environment variable based on the current CI environment
 * @param varNameRoot - variable name without the environment prefix
 * @param envName - Environment option
 * @returns Value of the environment variable
 * @example
 * envVarBasedOnCIEnv('FIREBASE_PROJECT_ID')
 * // => 'fireadmin-stage' (value of 'STAGE_FIREBASE_PROJECT_ID' environment var)
 */
export function envVarBasedOnCIEnv(varNameRoot: string, envName?: string): any {
  const prefix = getEnvPrefix(envName);
  const combined = `${prefix}${varNameRoot}`;
  const localTestConfigPath = join(
    DEFAULT_BASE_PATH,
    DEFAULT_TEST_FOLDER_PATH,
    "config.json"
  );

  // Config file used for environment (local, containers) from main test path ({integrationFolder}/config.json)
  if (existsSync(localTestConfigPath)) {
    const localConfigObj = readJsonFile(localTestConfigPath);
    const valueFromLocalConfig =
      localConfigObj[combined] || localConfigObj[varNameRoot];
    if (valueFromLocalConfig) {
      return valueFromLocalConfig;
    }
  }
  const fallbackConfigPath = join(
    DEFAULT_BASE_PATH,
    FALLBACK_TEST_FOLDER_PATH,
    "config.json"
  );
  // Config file used for environment from main cypress environment file (cypress.env.json)
  if (existsSync(fallbackConfigPath)) {
    const configObj = readJsonFile(fallbackConfigPath);
    const valueFromCypressEnv = configObj[combined] || configObj[varNameRoot];
    if (valueFromCypressEnv) {
      return valueFromCypressEnv;
    }
  }

  // CI Environment (environment variables loaded directly)
  return process.env[combined] || process.env[varNameRoot];
}

/**
 * Get parsed value of environment variable. Useful for environment variables
 * which have characters that need to be escaped.
 * @param varNameRoot - variable name without the environment prefix
 * @param envName - variable name without the environment prefix
 * @returns Value of the environment variable
 * @example
 * getParsedEnvVar('FIREBASE_PRIVATE_KEY_ID')
 * // => 'fireadmin-stage' (parsed value of 'STAGE_FIREBASE_PRIVATE_KEY_ID' environment var)
 */
function getParsedEnvVar(varNameRoot: string, envName?: string): any {
  const val = envVarBasedOnCIEnv(varNameRoot);
  const prefix = getEnvPrefix(envName);
  const combinedVar = `${prefix}${varNameRoot}`;
  if (!val) {
    /* eslint-disable no-console */
    console.error(
      `${combinedVar} not found, make sure it is set within environment vars`
    );
    /* eslint-enable no-console */
  }
  try {
    if (isString(val)) {
      return JSON.parse(val);
    }
    return val;
  } catch (err) {
    /* eslint-disable no-console */
    console.error(`Error parsing ${combinedVar}`);
    /* eslint-enable no-console */
    return val;
  }
}

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Get service account from either local file or environment variables
 * @param envSlug - Slug for current environment
 * @returns Service account object
 */
export function getServiceAccount(envSlug?: string): ServiceAccount {
  const serviceAccountPath = getServiceAccountPath(envSlug);

  // Check for local service account file (Local dev)
  if (existsSync(serviceAccountPath)) {
    return require(serviceAccountPath); // eslint-disable-line global-require, import/no-dynamic-require
  }

  // Use single environment variable for service account object (CI)
  const serviceAccountEnvVar = envVarBasedOnCIEnv("SERVICE_ACCOUNT", envSlug);
  if (serviceAccountEnvVar) {
    if (typeof serviceAccountEnvVar === "string") {
      try {
        return JSON.parse(serviceAccountEnvVar);
      } catch (err) {
        /* eslint-disable no-console */
        console.error(
          "Issue parsing SERVICE_ACCOUNT environment variable from string to object, returning string"
        );
        /* eslint-enable no-console */
      }
    }
    return serviceAccountEnvVar;
  }

  const clientId = envVarBasedOnCIEnv("FIREBASE_CLIENT_ID", envSlug);
  if (clientId) {
    /* eslint-disable no-console */
    console.error(
      '"FIREBASE_CLIENT_ID" will override FIREBASE_TOKEN for auth when calling firebase-tools - this may cause unexepected behavior'
    );
    /* eslint-enable no-console */
  }

  /* eslint-disable @typescript-eslint/camelcase */
  // Multiple environment variables to build object (CI)
  return {
    type: "service_account",
    project_id: envVarBasedOnCIEnv("FIREBASE_PROJECT_ID", envSlug),
    private_key_id: envVarBasedOnCIEnv("FIREBASE_PRIVATE_KEY_ID", envSlug),
    private_key: getParsedEnvVar("FIREBASE_PRIVATE_KEY", envSlug),
    client_email: envVarBasedOnCIEnv("FIREBASE_CLIENT_EMAIL", envSlug),
    client_id: clientId,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://accounts.google.com/o/oauth2/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: envVarBasedOnCIEnv("FIREBASE_CERT_URL", envSlug)
  };
  /* eslint-enable @typescript-eslint/camelcase */
}

let fbInstance: admin.app.App;

/**
 * Initialize Firebase instance from service account (from either local
 * serviceAccount.json or environment variables)
 * @returns Initialized Firebase instance
 */
export function initializeFirebase(): admin.app.App {
  try {
    // Get service account from local file falling back to environment variables
    if (!fbInstance) {
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        fbInstance = admin.initializeApp({ projectId: 'test' })
        admin.firestore().settings({
          servicePath: 'localhost',
          port: 8080
        });
      } else {
        const serviceAccount = getServiceAccount();
        const projectId = get(serviceAccount, "project_id");
        if (!isString(projectId)) {
          const missingProjectIdErr =
            "Error project_id from service account to initialize Firebase.";
          console.error(missingProjectIdErr); // eslint-disable-line no-console
          throw new Error(missingProjectIdErr);
        }
        const cleanProjectId = projectId.replace(
          "firebase-top-agent-int",
          "top-agent-int"
        );

        fbInstance = admin.initializeApp({
          credential: admin.credential.cert((serviceAccount as any)),
          databaseURL: `https://${cleanProjectId}.firebaseio.com`
        });
      }
    }
    return fbInstance;
  } catch (err) {
    /* eslint-disable no-console */
    console.error(
      "Error initializing firebase-admin instance from service account."
    );
    /* eslint-enable no-console */
    throw err;
  }
}

/**
 * Convert slash path to Firestore reference
 * @param firestoreInstance - Instance on which to
 * create ref
 * @param slashPath - Path to convert into firestore refernce
 * @param options - Options object
 * @returns Ref at slash path
 */
export function slashPathToFirestoreRef(
  firestoreInstance: any,
  slashPath: string,
  options?: any,
): admin.firestore.CollectionReference | admin.firestore.DocumentReference | admin.firestore.Query {
  const isDocPath = slashPath.split('/').length % 2;
  
 const ref = isDocPath
    ? firestoreInstance.collection(slashPath)
    : firestoreInstance.doc(slashPath);

  // Apply limit to query if it exists
  if (options && options.limit && typeof ref.limit === 'function') {
    return ref.limit(options.limit);
  }

  return ref;
}

/**
 * Create command arguments string from an array of arguments by joining them
 * with a space including a leading space. If no args provided, empty string
 * is returned
 * @param args - Command arguments to convert into a string
 * @returns Arguments section of command string
 */
export function getArgsString(args: string[]): string {
  return args && args.length ? ` ${args.join(" ")}` : "";
}
