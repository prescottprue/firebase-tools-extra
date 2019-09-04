import * as admin from "firebase-admin";
import { isString, get } from "lodash";
import path from "path";
import fs from "fs";
import {
  DEFAULT_BASE_PATH,
  DEFAULT_TEST_FOLDER_PATH,
  FALLBACK_TEST_FOLDER_PATH
} from "./constants";

/**
 * Get settings from firebaserc file
 * @return {Object} Firebase settings object
 */
export function readJsonFile(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
 catch (err) {
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

interface DataItem {
  id: string
  data: any
}

// type QueryOrDocumentSnapshot = admin.firestore.QuerySnapshot & admin.firestore.DocumentSnapshot
/**
 * Create data object with values for each document with keys being doc.id.
 * @param  {firebase.database.DataSnapshot} snapshot - Data for which to create
 * an ordered array.
 * @return {Object|Null} Object documents from snapshot or null
 */
export function dataArrayFromSnap(snap: admin.firestore.QuerySnapshot | admin.firestore.DocumentSnapshot): DataItem[] {
  const data = [];
  if (snap instanceof admin.firestore.DocumentSnapshot && snap.data && snap.exists) {
    data.push({ id: snap.id, data: snap.data() });
  } else if (snap instanceof admin.firestore.QuerySnapshot && snap.forEach) {
    snap.forEach(doc => {
      data.push({ id: doc.id, data: doc.data() || doc });
    });
  }
  return data;
}

/**
 * Parse fixture path string into JSON with error handling
 * @param {String} unparsed - Unparsed string to be parsed into JSON
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

function getEnvironmentSlug(): string {
  return (
    process.env.CI_ENVIRONMENT_SLUG || process.env.CI_COMMIT_REF_SLUG || "stage"
  );
}

/**
 * Get prefix for current environment based on environment vars available
 * within CI. Falls back to staging (i.e. STAGE)
 * @return {String} Environment prefix string
 */
export function getEnvPrefix(envName?: string): string {
  const envSlug = envName || getEnvironmentSlug();
  return `${envSlug.toUpperCase()}_`;
}

function getServiceAccountPath(envName = ""): string {
  const withPrefix = path.join(
    DEFAULT_BASE_PATH,
    `serviceAccount-${envName}.json`
  );
  if (fs.existsSync(withPrefix)) {
    return withPrefix;
  }
  return path.join(DEFAULT_BASE_PATH, "serviceAccount.json");
}

/**
 * Get environment variable based on the current CI environment
 * @param  {String} varNameRoot - variable name without the environment prefix
 * @return {Any} Value of the environment variable
 * @example
 * envVarBasedOnCIEnv('FIREBASE_PROJECT_ID')
 * // => 'fireadmin-stage' (value of 'STAGE_FIREBASE_PROJECT_ID' environment var)
 */
export function envVarBasedOnCIEnv(varNameRoot: string): any {
  const prefix = getEnvPrefix();
  const combined = `${prefix}${varNameRoot}`;
  const localTestConfigPath = path.join(
    DEFAULT_BASE_PATH,
    DEFAULT_TEST_FOLDER_PATH,
    "config.json"
  );

  if (fs.existsSync(localTestConfigPath)) {
    const configObj = require(localTestConfigPath); // eslint-disable-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
    return configObj[combined] || configObj[varNameRoot];
  }
  const fallbackConfigPath = path.join(
    DEFAULT_BASE_PATH,
    FALLBACK_TEST_FOLDER_PATH,
    "config.json"
  );
  if (fs.existsSync(fallbackConfigPath)) {
    const configObj = require(fallbackConfigPath); // eslint-disable-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
    return configObj[combined] || configObj[varNameRoot];
  }

  // CI Environment (environment variables loaded directly)
  return process.env[combined] || process.env[varNameRoot];
}

/**
 * Get parsed value of environment variable. Useful for environment variables
 * which have characters that need to be escaped.
 * @param  {String} varNameRoot - variable name without the environment prefix
 * @return {Any} Value of the environment variable
 * @example
 * getParsedEnvVar('FIREBASE_PRIVATE_KEY_ID')
 * // => 'fireadmin-stage' (parsed value of 'STAGE_FIREBASE_PRIVATE_KEY_ID' environment var)
 */
function getParsedEnvVar(varNameRoot: string): any {
  const val = envVarBasedOnCIEnv(varNameRoot);
  const prefix = getEnvPrefix();
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
 * @return {Object} Service account object
 */
/**
 * Get service account from either local file or environment variables
 * @return {Object} Service account object
 */
export function getServiceAccount(envSlug?: string): ServiceAccount {
  const serviceAccountPath = getServiceAccountPath(envSlug);
  // Check for local service account file (Local dev)
  if (fs.existsSync(serviceAccountPath)) {
    return require(serviceAccountPath); // eslint-disable-line global-require, import/no-dynamic-require
  }
  // Use environment variables (CI)
  const serviceAccountEnvVar = envVarBasedOnCIEnv("SERVICE_ACCOUNT");
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
  const clientId = envVarBasedOnCIEnv("FIREBASE_CLIENT_ID");
  if (clientId) {
    /* eslint-disable no-console */
    console.error(
      '"FIREBASE_CLIENT_ID" will override FIREBASE_TOKEN for auth when calling firebase-tools - this may cause unexepected behavior'
    );
    /* eslint-enable no-console */
  }
  /* eslint-disable @typescript-eslint/camelcase */
  return {
    type: "service_account",
    project_id: envVarBasedOnCIEnv("FIREBASE_PROJECT_ID"),
    private_key_id: envVarBasedOnCIEnv("FIREBASE_PRIVATE_KEY_ID"),
    private_key: getParsedEnvVar("FIREBASE_PRIVATE_KEY"),
    client_email: envVarBasedOnCIEnv("FIREBASE_CLIENT_EMAIL"),
    client_id: clientId,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://accounts.google.com/o/oauth2/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: envVarBasedOnCIEnv("FIREBASE_CERT_URL")
  };
  /* eslint-enable @typescript-eslint/camelcase */
}

let fbInstance: admin.app.App;

/**
 * Initialize Firebase instance from service account (from either local
 * serviceAccount.json or environment variables)
 * @return {Firebase} Initialized Firebase instance
 */
export function initializeFirebase(): admin.app.App {
  try {
    // Get service account from local file falling back to environment variables
    if (!fbInstance) {
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
 * @param  {firestore.Firestore} firestoreInstance - Instance on which to
 * create ref
 * @param  {String} slashPath - Path to convert into firestore refernce
 * @return {firestore.CollectionReference|firestore.DocumentReference}
 */
export function slashPathToFirestoreRef(
  firestoreInstance: any,
  slashPath: string,
  options?: any
): admin.firestore.CollectionReference & admin.firestore.DocumentReference {
  let ref = firestoreInstance;
  const srcPathArr = slashPath.split("/");
  srcPathArr.forEach(pathSegment => {
    if (ref.collection) {
      ref = ref.collection(pathSegment);
    } else if (ref.doc) {
      ref = ref.doc(pathSegment);
    } else {
      throw new Error(`Invalid slash path: ${slashPath}`);
    }
  });

  // Apply limit to query if it exists
  if (options.limit && typeof ref.limit === "function") {
    ref = ref.limit(options.limit);
  }

  return ref;
}

/**
 * Create command arguments string from an array of arguments by joining them
 * with a space including a leading space. If no args provided, empty string
 * is returned
 * @param  {Array} args - Command arguments to convert into a string
 * @return {String} Arguments section of command string
 */
export function getArgsString(args: string[]): string {
  return args && args.length ? ` ${args.join(" ")}` : "";
}
