import * as admin from 'firebase-admin';
import { join } from 'path';
import { existsSync, readFileSync, writeFile } from 'fs';
import { promisify } from 'util';
import * as logger from './logger';

export const writeFilePromise = promisify(writeFile);

/**
 * Check whether a value is a string or not
 * @param valToCheck - Value to check
 * @returns Whether or not value is a string
 */
export function isString(valToCheck: any): boolean {
  return typeof valToCheck === 'string' || valToCheck instanceof String;
}

/**
 * Get settings from firebaserc file
 * @param filePath - Path for file
 * @returns Firebase settings object
 */
export function readJsonFile(filePath: string): any {
  if (!existsSync(filePath)) {
    const errMsg = `File does not exist at path "${filePath}"`;
    /* eslint-disable no-console */
    logger.error(errMsg);
    /* eslint-enable no-console */
    throw new Error(errMsg);
  }

  try {
    const fileBuffer = readFileSync(filePath, 'utf8');
    return JSON.parse(fileBuffer.toString());
  } catch (err) {
    /* eslint-disable no-console */
    logger.error(
      `Unable to parse ${filePath.replace(
        process.cwd(),
        '',
      )} - JSON is most likley not valid`,
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
export function tryToJsonParse(unparsed: any): any {
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
    process.env.CI_ENVIRONMENT_SLUG || process.env.CI_COMMIT_REF_SLUG || 'stage'
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
    process.cwd(),
    `serviceAccount-${envName || ''}.json`,
  );
  if (existsSync(withSuffix)) {
    return withSuffix;
  }
  return join(process.cwd(), 'serviceAccount.json');
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
    logger.error(
      `${combinedVar} not found, make sure it is set within environment vars`,
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
    logger.error(`Error parsing ${combinedVar}`);
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
  const serviceAccountEnvVar = envVarBasedOnCIEnv('SERVICE_ACCOUNT', envSlug);
  if (serviceAccountEnvVar) {
    if (typeof serviceAccountEnvVar === 'string') {
      try {
        return JSON.parse(serviceAccountEnvVar);
      } catch (err) {
        /* eslint-disable no-console */
        logger.error(
          'Issue parsing SERVICE_ACCOUNT environment variable from string to object, returning string',
        );
        /* eslint-enable no-console */
      }
    }
    return serviceAccountEnvVar;
  }

  const clientId = envVarBasedOnCIEnv('FIREBASE_CLIENT_ID', envSlug);
  if (clientId) {
    /* eslint-disable no-console */
    logger.error(
      '"FIREBASE_CLIENT_ID" will override FIREBASE_TOKEN for auth when calling firebase-tools - this may cause unexepected behavior',
    );
    /* eslint-enable no-console */
  }

  /* eslint-disable @typescript-eslint/camelcase */
  // Multiple environment variables to build object (CI)
  return {
    type: 'service_account',
    project_id: envVarBasedOnCIEnv('FIREBASE_PROJECT_ID', envSlug),
    private_key_id: envVarBasedOnCIEnv('FIREBASE_PRIVATE_KEY_ID', envSlug),
    private_key: getParsedEnvVar('FIREBASE_PRIVATE_KEY', envSlug),
    client_email: envVarBasedOnCIEnv('FIREBASE_CLIENT_EMAIL', envSlug),
    client_id: clientId,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://accounts.google.com/o/oauth2/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: envVarBasedOnCIEnv('FIREBASE_CERT_URL', envSlug),
  };
  /* eslint-enable @typescript-eslint/camelcase */
}

/**
 * Get service account from either local file or environment variables
 * @param envSlug - Environment option
 * @returns Service account object
 */
export function getServiceAccountWithoutWarning(
  envSlug?: string,
): ServiceAccount | null {
  const serviceAccountPath = getServiceAccountPath(envSlug);
  // Check for local service account file (Local dev)
  if (existsSync(serviceAccountPath)) {
    return readJsonFile(serviceAccountPath); // eslint-disable-line global-require, import/no-dynamic-require
  }

  // Use environment variables (CI)
  const serviceAccountEnvVar = envVarBasedOnCIEnv('SERVICE_ACCOUNT', envSlug);
  if (serviceAccountEnvVar) {
    if (typeof serviceAccountEnvVar === 'string') {
      try {
        return JSON.parse(serviceAccountEnvVar);
      } catch (err) {
        /* eslint-disable no-console */
        logger.warn(
          `Issue parsing "SERVICE_ACCOUNT" environment variable from string to object, returning string`,
        );
        /* eslint-enable no-console */
      }
    }
    return serviceAccountEnvVar;
  }

  return null;
}

let fbInstance: admin.app.App;

/**
 * Get projectId for emulated project. Attempts to load from
 * FIREBASE_PROJECT or FIREBASE_PROJECT_ID from environment variables
 * within node environment or from the cypress environment. If not
 * found within environment, falls back to serviceAccount.json file
 * then defaults to "test".
 * @returns projectId for emulated project
 */
function getEmulatedProjectId(): string {
  const GCLOUD_PROJECT = envVarBasedOnCIEnv('GCLOUD_PROJECT');
  if (GCLOUD_PROJECT) {
    return GCLOUD_PROJECT;
  }
  const FIREBASE_PROJECT = envVarBasedOnCIEnv('FIREBASE_PROJECT');
  if (FIREBASE_PROJECT) {
    return FIREBASE_PROJECT;
  }
  const FIREBASE_PROJECT_ID = envVarBasedOnCIEnv('FIREBASE_PROJECT_ID');
  if (FIREBASE_PROJECT_ID) {
    return FIREBASE_PROJECT_ID;
  }
  // Get service account from local file falling back to environment variables
  const serviceAccount = getServiceAccountWithoutWarning();
  return serviceAccount?.project_id || 'test';
}

/**
 * Get settings for Firestore from environment. Loads port and servicePath from
 * FIRESTORE_EMULATOR_HOST node environment variable if found, otherwise
 * defaults to port 8080 and servicePath "localhost".
 * @returns Firestore settings to be passed to firebase.firestore().settings
 */
function firestoreSettingsFromEnv(): FirebaseFirestore.Settings {
  const { FIRESTORE_EMULATOR_HOST } = process.env;
  if (
    typeof FIRESTORE_EMULATOR_HOST === 'undefined' ||
    !isString(FIRESTORE_EMULATOR_HOST)
  ) {
    return {
      servicePath: 'localhost',
      port: 8080,
    };
  }
  const [servicePath, portStr] = FIRESTORE_EMULATOR_HOST.split(':');
  return {
    servicePath,
    port: parseInt(portStr, 10),
  };
}

interface InitOptions {
  /* Whether or not to use emulator */
  emulator?: boolean;
}

/**
 * Initialize Firebase instance from service account (from either local
 * serviceAccount.json or environment variables)
 *
 * @returns Initialized Firebase instance
 * @param options
 */
export function initializeFirebase(options?: InitOptions): admin.app.App {
  if (fbInstance) {
    return fbInstance;
  }
  // Use emulator if it exists in environment
  const {
    FIRESTORE_EMULATOR_HOST,
    FIREBASE_DATABASE_EMULATOR_HOST,
  } = process.env;
  if (
    FIRESTORE_EMULATOR_HOST ||
    FIREBASE_DATABASE_EMULATOR_HOST ||
    options?.emulator
  ) {
    try {
      // TODO: Look into using @firebase/testing in place of admin here to allow for
      // usage of clearFirestoreData (see https://github.com/prescottprue/cypress-firebase/issues/73 for more info)
      const projectId = getEmulatedProjectId();

      const fbConfig: any = { projectId };
      // Initialize RTDB with databaseURL from FIREBASE_DATABASE_EMULATOR_HOST to allow for RTDB actions
      // within Emulator
      if (FIREBASE_DATABASE_EMULATOR_HOST || options?.emulator) {
        fbConfig.databaseURL = `http://${FIREBASE_DATABASE_EMULATOR_HOST ||
          'localhost:9000'}?ns=${fbConfig.projectId || 'local'}`;
        /* eslint-disable no-console */
        logger.info('Using RTDB emulator with DB URL:', fbConfig.databaseURL);
        /* eslint-enable no-console */
      }

      // Add service account credential if it exists so that custom auth tokens can be generated
      const serviceAccount = getServiceAccountWithoutWarning();
      if (serviceAccount) {
        fbConfig.credential = admin.credential.cert(serviceAccount as any);
      }

      fbInstance = admin.initializeApp(fbConfig);
      if (FIRESTORE_EMULATOR_HOST || options?.emulator) {
        const firestoreSettings = firestoreSettingsFromEnv();
        logger.info(
          'Using Firestore emulator with settings:',
          firestoreSettings,
        );
        admin.firestore().settings(firestoreSettings);
      }
    } catch (err) {
      /* eslint-disable no-console */
      logger.error(
        'Error initializing firebase-admin instance with emulator settings.',
        err.message,
      );
      /* eslint-enable no-console */
      throw err;
    }
  } else {
    try {
      // Get service account from local file falling back to environment variables
      const serviceAccount = getServiceAccount();
      const projectId = serviceAccount && serviceAccount.project_id;
      if (!isString(projectId)) {
        const missingProjectIdErr =
          'Error project_id from service account to initialize Firebase.';
        logger.error(missingProjectIdErr);
        throw new Error(missingProjectIdErr);
      }
      const cleanProjectId = projectId.replace(
        'firebase-top-agent-int',
        'top-agent-int',
      );

      fbInstance = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        databaseURL: `https://${cleanProjectId}.firebaseio.com`,
      });
    } catch (err) {
      logger.error(
        'Error initializing firebase-admin instance from service account.',
        err.message,
      );
      throw err;
    }
  }
  return fbInstance;
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
):
  | admin.firestore.CollectionReference
  | admin.firestore.DocumentReference
  | admin.firestore.Query {
  if (!slashPath) {
    throw new Error('Path is required to make Firestore Reference');
  }
  const isCollectionPath = slashPath.split('/').length % 2;

  let ref = isCollectionPath
    ? firestoreInstance.collection(slashPath)
    : firestoreInstance.doc(slashPath);

  // Apply orderBy to query if it exists
  if (options?.orderBy && typeof ref.orderBy === 'function') {
    ref = ref.orderBy(options.orderBy);
  }
  // Apply where to query if it exists
  if (options?.where && typeof ref.where === 'function') {
    ref = ref.where(...options.where);
  }

  // Apply limit to query if it exists
  if (options?.limit && typeof ref.limit === 'function') {
    ref = ref.limit(options.limit);
  }

  // Apply limitToLast to query if it exists
  if (options?.limitToLast && typeof ref.limitToLast === 'function') {
    ref = ref.limitToLast(options.limitToLast);
  }

  return ref;
}

/**
 * @param firestoreInstance - Instance of firestore from which to delete collection
 * @param query - Parent collection query
 * @param resolve - Function to call to resolve
 * @param reject - Function to call to reject
 */
function deleteQueryBatch(
  firestoreInstance: any,
  query: any,
  resolve: Function,
  reject: Function,
): any {
  query
    .get()
    .then((snapshot: any) => {
      // When there are no documents left, we are done
      if (snapshot.size === 0) {
        return 0;
      }

      // Delete documents in a batch
      const batch = firestoreInstance.batch();
      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      return batch.commit().then(() => {
        return snapshot.size;
      });
    })
    .then((numDeleted: any) => {
      if (numDeleted === 0) {
        resolve();
        return;
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(firestoreInstance, query, resolve, reject);
      });
    })
    .catch(reject);
}

/**
 * @param firestoreInstance - Instance of firestore from which to delete collection
 * @param collectionPath - Path of collection to delete
 * @param batchSize - Size of batch
 * @returns Promise which resolves when collection has been deleted
 */
export function deleteFirestoreCollection(
  firestoreInstance: any,
  collectionPath: string,
  batchSize?: number,
): Promise<any> {
  const collectionRef = firestoreInstance.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize || 200);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(firestoreInstance, query, resolve, reject);
  });
}
