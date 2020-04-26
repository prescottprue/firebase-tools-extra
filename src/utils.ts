import * as admin from 'firebase-admin';
import { existsSync, readFileSync, writeFile } from 'fs';
import { promisify } from 'util';
import * as logger from './logger';

export const writeFilePromise = promisify(writeFile);

/**
 * Check whether a value is a string or not
 * @param valToCheck - Value to check
 * @returns Whether or not value is a string
 */
function isString(valToCheck: any): boolean {
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
    logger.error(
      `Unable to parse ${filePath.replace(
        process.cwd(),
        '',
      )} - JSON is most likely not valid`,
    );
    return {};
  }
}

/**
 * Parse fixture path string into JSON with error handling
 * @param valueToParse - valueToParse string to be parsed into JSON
 * @returns Parsed fixture value or path
 */
export function tryToJsonParse(valueToParse: any): any {
  if (isString(valueToParse)) {
    try {
      return JSON.parse(valueToParse);
    } catch (err) {
      return valueToParse;
    }
  }
  return valueToParse;
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
 * @returns Service account object
 */
export function getServiceAccount(): ServiceAccount | null {
  const serviceAccountPath = `${process.cwd()}/serviceAccount.json`;
  // Check for local service account file (Local dev)
  if (existsSync(serviceAccountPath)) {
    return readJsonFile(serviceAccountPath); // eslint-disable-line global-require, import/no-dynamic-require
  }

  // Use environment variables (CI)
  const { SERVICE_ACCOUNT } = process.env;
  if (SERVICE_ACCOUNT) {
    try {
      return JSON.parse(SERVICE_ACCOUNT);
    } catch (err) {
      logger.warn(
        `Issue parsing "SERVICE_ACCOUNT" environment variable from string to object: `,
        err.message,
      );
    }
  }

  return null;
}

let fbInstance: admin.app.App;

interface InitOptions {
  /* Whether or not to use emulator */
  emulator?: boolean;
  debug?: boolean;
}

interface FirebaseJsonProjects {
  default?: string;
  [k: string]: string | undefined;
}

interface FirebaseJsonEmulatorSetting {
  port?: string | number;
}

interface FirebaseJsonEmulatorSettings {
  database?: FirebaseJsonEmulatorSetting;
  firestore?: FirebaseJsonEmulatorSetting;
  functions?: FirebaseJsonEmulatorSetting;
  hosting?: FirebaseJsonEmulatorSetting;
  pubsub?: FirebaseJsonEmulatorSetting;
}

interface FirebaseJson {
  projects?: FirebaseJsonProjects;
  emulators?: FirebaseJsonEmulatorSettings;
  database?: any;
  functions?: any;
  storage?: any;
  hosting?: any;
}

/**
 * Load settings from firebase.json if it exists in
 * cwd of command
 * @returns firebase.json contents
 */
function loadFirebaseJsonSettings(): FirebaseJson | undefined {
  const firebaseJsonPath = `${process.cwd()}/firebase.json`;
  if (existsSync(firebaseJsonPath)) {
    return readJsonFile(firebaseJsonPath);
  }
}

/**
 * Initialize Firebase instance from service account (from either local
 * serviceAccount.json or environment variables)
 *
 * @returns Initialized Firebase instance
 * @param options - Options object
 */
export function initializeFirebase(options?: InitOptions): admin.app.App {
  // Return existing firebase-admin app instance
  if (fbInstance) {
    return fbInstance;
  }

  // Return if init has already occurred in firebase-admin
  if (admin.apps.length !== 0) {
    fbInstance = admin.apps[0] as any; // eslint-disable-line prefer-destructuring
    return fbInstance;
  }

  // Use emulator if settings exists in environment or if emulator option is true
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
      // Get settings for emulators and service account to add as credential if it exists
      const { GCLOUD_PROJECT, FIREBASE_PROJECT } = process.env;
      const serviceAccount = getServiceAccount();
      const firebaseJson = loadFirebaseJsonSettings();
      const projectId =
        GCLOUD_PROJECT ||
        FIREBASE_PROJECT ||
        serviceAccount?.project_id ||
        firebaseJson?.projects?.default ||
        'test';
      const fbConfig: any = { projectId };

      // Initialize RTDB with databaseURL from FIREBASE_DATABASE_EMULATOR_HOST to allow for RTDB actions
      // within Emulator
      if (FIREBASE_DATABASE_EMULATOR_HOST || options?.emulator) {
        const databaseEmulatorHost =
          FIREBASE_DATABASE_EMULATOR_HOST ||
          (firebaseJson?.emulators?.database?.port
            ? `localhost:${firebaseJson?.emulators?.database?.port}`
            : 'localhost:9000');
        // Set default database emulator host if none is set (so it is picked up by firebase-admin)
        // TODO: attempt to load settings from firebase.json for port numbers
        if (!FIREBASE_DATABASE_EMULATOR_HOST) {
          process.env.FIREBASE_DATABASE_EMULATOR_HOST = databaseEmulatorHost;
        }

        // TODO: Check into if namespace is required or if it should be optional
        // TODO: Support passing a database url
        fbConfig.databaseURL = `http://${databaseEmulatorHost}?ns=${projectId}`;

        // Log setting if debug option enabled
        if (options?.debug) {
          logger.info(
            `Using RTDB emulator with DB URL: ${fbConfig.databaseURL}`,
          );
        }
      }

      // Add service account credential if it exists so that custom auth tokens can be generated
      if (serviceAccount) {
        fbConfig.credential = admin.credential.cert(serviceAccount as any);
      }

      fbInstance = admin.initializeApp(fbConfig);

      // Enable Firestore Emulator is env variable is set or emulator option is enabled
      if (FIRESTORE_EMULATOR_HOST || options?.emulator) {
        // Get host from env variable, falling back to firebase.json, then to localhost:8080
        const firestoreEmulatorHost =
          FIRESTORE_EMULATOR_HOST ||
          (firebaseJson?.emulators?.firestore?.port
            ? `localhost:${firebaseJson?.emulators?.firestore?.port}`
            : 'localhost:8080');
        const [servicePath, portStr] = firestoreEmulatorHost.split(':');
        const firestoreSettings = {
          servicePath,
          port: parseInt(portStr, 10),
        };

        // Set default Firestore emulator host if none is set (so it is picked up by firebase-admin)
        if (!FIRESTORE_EMULATOR_HOST) {
          process.env.FIRESTORE_EMULATOR_HOST = firestoreEmulatorHost;
        }

        // Log setting if debug option enabled
        if (options?.debug) {
          logger.info(
            `Using Firestore emulator with host: ${firestoreEmulatorHost}`,
          );
        }
        admin.firestore().settings(firestoreSettings);
      }
    } catch (err) {
      logger.error(
        'Error initializing firebase-admin instance with emulator settings.',
        err.message,
      );
      throw err;
    }
  } else {
    try {
      // Get service account from local file falling back to environment variables
      const serviceAccount = getServiceAccount();
      const projectId = serviceAccount?.project_id;
      if (!projectId || !isString(projectId)) {
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
 * Check with or not a slash path is the path of a document
 * @param slashPath - Path to check for whether or not it is a doc
 * @returns Whether or not slash path is a document path
 */
function isDocPath(slashPath: string): boolean {
  return !(slashPath.replace(/^\/|\/$/g, '').split('/').length % 2);
}

/**
 * Convert slash path to Firestore reference
 * @param firestoreInstance - Instance on which to
 * create ref
 * @param slashPath - Path to convert into firestore reference
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

  let ref = isDocPath(slashPath)
    ? firestoreInstance.doc(slashPath)
    : firestoreInstance.collection(slashPath);

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

/**
 * Run promises in a waterfall instead of all the same time (Promise.all)
 * @param {Array} callbacks - List of promises to run in order
 * @returns {Promise} Resolves when all promises have completed in order
 */
export function promiseWaterfall(callbacks: any[]): Promise<any[]> {
  return callbacks.reduce(
    (accumulator: any, callback: any) =>
      accumulator.then(
        typeof callback === 'function' ? callback : (): any => callback,
      ),
    Promise.resolve(),
  );
}

/**
 * Converts a JSON object into data to be written to Firestore
 * @param {object} data An exported object property from `firestore-backup-restore`
 * @returns {object} JSON object representing Firestore data
 */
export function typedJSONToObject(data: any): any {
  return data
    ? Object.keys(data).reduce((acc, key) => {
        const prop = data[key];
        switch (prop.type) {
          case 'object':
            (acc as any)[key] = typedJSONToObject(prop.value);
            break;
          case 'geopoint':
            (acc as any)[key] = new admin.firestore.GeoPoint(
              prop.value?._latitude,
              prop.value?._longitude,
            );
            break;
          case 'timestamp':
            (acc as any)[key] = new admin.firestore.Timestamp(
              prop.value?._seconds,
              prop.value?._nanoseconds,
            );
            break;
          case 'array':
            (acc as any)[key] = typedJSONToArray(prop.value); // eslint-disable-line @typescript-eslint/no-use-before-define
            break;
          default:
            (acc as any)[key] = prop.value;
            break;
        }
        return acc;
      }, {})
    : null;
}

/**
 * Converts an array 'property' exported via `firestore-backup-restore` to a JS
 * object.
 * @param {Array} data An exported array property from `firestore-backup-restore`
 * @returns {object} JSON object representing Firestore data
 */
export function typedJSONToArray(data: any): any[] {
  return (
    data &&
    data.reduce((acc: any, item: any) => {
      switch (item.type) {
        case 'object':
          acc.push(typedJSONToObject(item.value));
          break;
        case 'array':
          acc.push(typedJSONToArray(item.value));
          break;
        default:
          acc.push(item.value);
          break;
      }

      return acc;
    }, [])
  );
}

/**
 * Returns the JS type of a given value.
 * @param {any} value - Value to get type of
 * @returns {string} String representing the type of an item
 */
function typeStr(value: any): string {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object' && value?._nanoseconds && value?._seconds) {
    return 'timestamp';
  }
  if (typeof value === 'object' && value?.latitude && value?.longitude) {
    return 'geopoint';
  }
  return typeof value;
}

/**
 * Convert a JS object to a JSON object that includes type information.
 * @param {object} obj - Object to convert to typed JSON
 * @returns {Array} Object with typed values
 */
export function objectToTypedJSON(obj: any): any {
  return obj
    ? Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        const type = typeStr(value);
        switch (type) {
          case 'object':
            (acc as any)[key] = { value: objectToTypedJSON(value), type };
            break;
          case 'array':
            (acc as any)[key] = { value: arrayToTypedJSON(value), type }; // eslint-disable-line @typescript-eslint/no-use-before-define
            break;
          default:
            (acc as any)[key] = { value, type };
            break;
        }
        return acc;
      }, {})
    : null;
}

/**
 * Convert a JS array to a JSON array that includes type information.
 * @param {Array} arr - Array to add type information to
 * @returns {Array} Array with typed info
 */
export function arrayToTypedJSON(arr: any): any[] {
  return arr.reduce((acc: any, value: any) => {
    const type = typeStr(value);
    switch (type) {
      case 'object':
        arr.push({ value: objectToTypedJSON(value), type });
        break;
      case 'array':
        arr.push({ value: arrayToTypedJSON(value), type });
        break;
      default:
        acc.push({ value, type });
    }
    return acc;
  }, []);
}
